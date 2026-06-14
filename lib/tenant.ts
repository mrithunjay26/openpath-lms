import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { MembershipRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

// Capability helpers live in lib/permissions.ts (usable on client + server).
export { isStaff, canManage, can, roleLabel } from "@/lib/permissions";

/**
 * Resolve the current user's membership in a workspace in a SINGLE query.
 * Returns 404 for non-members so workspace existence isn't leaked. Memoized
 * per request, so the layout and page share one round-trip.
 */
export const getTenantContext = cache(async (slug: string) => {
  const user = await requireUser(`/${slug}`);

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      firebase: {
        select: { status: true, projectId: true, storageBucket: true },
      },
      memberships: { where: { userId: user.id }, take: 1 },
    },
  });
  if (!tenant) notFound();

  const membership = tenant.memberships[0];
  if (!membership || membership.status === "SUSPENDED") notFound();

  return { user, tenant, membership, role: membership.role };
});

export type TenantContext = Awaited<ReturnType<typeof getTenantContext>>;

/** Require membership, optionally restricted to certain roles. */
export async function requireMembership(
  slug: string,
  roles?: MembershipRole[],
) {
  const ctx = await getTenantContext(slug);
  if (roles && !roles.includes(ctx.role)) {
    redirect(`/${slug}`);
  }
  return ctx;
}

export async function listUserTenants(userId: string) {
  return prisma.membership.findMany({
    where: { userId, status: { not: "SUSPENDED" } },
    include: {
      tenant: {
        include: { firebase: { select: { status: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Workspace creation is intentionally narrowed to educators/operators.
 * Students and TAs should join existing spaces rather than create new ones.
 */
export async function canCreateWorkspace(
  userId: string,
  platformRole?: string | null,
) {
  if (platformRole === "STUIMPACT_ADMIN") return true;

  const memberships = await prisma.membership.findMany({
    where: { userId, status: { not: "SUSPENDED" } },
    select: { role: true },
  });

  if (memberships.length === 0) return true;
  return memberships.some((membership) => membership.role === "OWNER" || membership.role === "TEACHER");
}

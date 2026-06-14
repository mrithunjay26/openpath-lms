"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MembershipRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canManage } from "@/lib/tenant";
import { randomJoinCode, randomToken } from "@/lib/crypto";
import { enrollUser } from "@/lib/firebase-data";
import { writeAudit } from "@/lib/audit";

export type FormState = { error?: string; ok?: boolean; message?: string } | undefined;

const INVITE_ROLES = new Set<MembershipRole>(["STUDENT", "TEACHER", "TA"]);

async function loadManager(slug: string) {
  const user = await requireUser();
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { firebase: { select: { status: true } } },
  });
  if (!tenant) return { error: "Workspace not found." as const };
  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
  });
  if (!membership || !canManage(membership.role)) {
    return { error: "Only teachers and owners can manage people." as const };
  }
  return { user, tenant };
}

export async function inviteMemberAction(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadManager(slug);
  if ("error" in ctx) return { error: ctx.error };

  const email = String(formData.get("email") || "").toLowerCase().trim();
  const role = String(formData.get("role") || "STUDENT") as MembershipRole;
  if (!email.includes("@")) return { error: "Enter a valid email." };
  if (!INVITE_ROLES.has(role)) return { error: "Pick a valid role." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.membership.upsert({
      where: {
        userId_tenantId: { userId: existing.id, tenantId: ctx.tenant.id },
      },
      update: { role, status: "ACTIVE" },
      create: {
        userId: existing.id,
        tenantId: ctx.tenant.id,
        role,
        status: "ACTIVE",
      },
    });
    revalidatePath(`/${slug}/people`);
    return { ok: true, message: `Added ${email} as ${role.toLowerCase()}.` };
  }

  await prisma.invitation.create({
    data: {
      tenantId: ctx.tenant.id,
      email,
      role,
      token: randomToken(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  revalidatePath(`/${slug}/people`);
  return {
    ok: true,
    message: `Invited ${email}. They'll join automatically when they sign up.`,
  };
}

export async function createJoinCodeAction(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadManager(slug);
  if ("error" in ctx) return { error: ctx.error };

  const courseId = String(formData.get("courseId") || "").trim() || null;
  const role = "STUDENT" as MembershipRole;

  const code = randomJoinCode();
  await prisma.joinCode.create({
    data: {
      tenantId: ctx.tenant.id,
      code,
      courseId,
      role,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  revalidatePath(`/${slug}/people`);
  return { ok: true, message: `Join code created: ${code}` };
}

export async function joinByCodeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const raw = String(formData.get("code") || "");
  const codes = raw
    .toUpperCase()
    .split(/[\s,]+/)
    .map((code) => code.trim())
    .filter(Boolean);
  if (codes.length === 0) return { error: "Enter at least one join code." };

  const joinCodes = await prisma.joinCode.findMany({
    where: { code: { in: codes } },
    include: { tenant: { include: { firebase: { select: { status: true } } } } },
  });
  if (joinCodes.length === 0) return { error: "Those codes aren't valid." };

  const now = new Date();
  const valid = joinCodes.filter((joinCode) => {
    if (joinCode.expiresAt && joinCode.expiresAt < now) return false;
    if (joinCode.maxUses && joinCode.uses >= joinCode.maxUses) return false;
    return true;
  });
  if (valid.length === 0) return { error: "Those codes have expired or are full." };

  const joinedTenants = new Set<string>();
  for (const joinCode of valid) {
    await prisma.membership.upsert({
      where: {
        userId_tenantId: { userId: user.id, tenantId: joinCode.tenantId },
      },
      update: {},
      create: {
        userId: user.id,
        tenantId: joinCode.tenantId,
        role: joinCode.role,
        status: "ACTIVE",
      },
    });
    joinedTenants.add(joinCode.tenant.slug);

    if (joinCode.courseId && joinCode.tenant.firebase?.status === "ACTIVE") {
      try {
        await enrollUser(joinCode.tenantId, joinCode.courseId, {
          userId: user.id,
          name: user.name ?? "",
          email: user.email ?? "",
          role: "STUDENT",
        });
      } catch {
        // membership still succeeds even if course enrollment fails
      }
    }

    await prisma.joinCode.update({
      where: { id: joinCode.id },
      data: { uses: { increment: 1 } },
    });
  }
  await writeAudit({
    action: "member.join",
    tenantId: valid[0]?.tenantId,
    actorId: user.id,
  });

  if (joinedTenants.size === 1) {
    redirect(`/${valid[0].tenant.slug}`);
  }
  redirect("/app");
}

export async function removeMemberAction(
  slug: string,
  membershipId: string,
): Promise<void> {
  const ctx = await loadManager(slug);
  if ("error" in ctx) return;

  const target = await prisma.membership.findUnique({
    where: { id: membershipId },
  });
  if (
    !target ||
    target.tenantId !== ctx.tenant.id ||
    target.role === "OWNER" ||
    target.userId === ctx.user.id
  ) {
    return;
  }
  await prisma.membership.delete({ where: { id: membershipId } });
  revalidatePath(`/${slug}/people`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canCreateWorkspace } from "@/lib/tenant";
import {
  brandingSchema,
  createTenantSchema,
  firebaseConnectSchema,
  RESERVED_SLUGS,
} from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { seal } from "@/lib/crypto";
import { verifyServiceAccount, disposeTenantApp } from "@/lib/firebase-admin";
import { writeAudit } from "@/lib/audit";
import { DEFAULT_THEME } from "@/lib/theme";

export type FormState = { error?: string; ok?: boolean } | undefined;

/** Load a tenant and assert the current user is its OWNER. */
async function loadOwner(slug: string) {
  const user = await requireUser();
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return { error: "Workspace not found." as const };
  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
  });
  if (!membership || membership.role !== "OWNER") {
    return { error: "Only the workspace owner can change this." as const };
  }
  return { user, tenant };
}

export async function createWorkspaceAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  if (!(await canCreateWorkspace(user.id, user.platformRole))) {
    return {
      error:
        "Workspace creation is reserved for educators and workspace operators. Students should join with a code.",
    };
  }

  const name = String(formData.get("name") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim().toLowerCase();
  const slug = rawSlug || slugify(name);

  const parsed = createTenantSchema.safeParse({ name, slug });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }
  if (RESERVED_SLUGS.has(parsed.data.slug)) {
    return { error: "That workspace URL is reserved. Please pick another." };
  }

  const existing = await prisma.tenant.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return { error: "That workspace URL is taken. Please pick another." };
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      theme: DEFAULT_THEME as unknown as Prisma.InputJsonValue,
      createdById: user.id,
      memberships: {
        create: { userId: user.id, role: "OWNER", status: "ACTIVE" },
      },
    },
  });

  await writeAudit({
    action: "tenant.create",
    tenantId: tenant.id,
    actorId: user.id,
    meta: { slug: tenant.slug },
  });

  redirect(`/${tenant.slug}?welcome=1`);
}

export async function connectFirebaseAction(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const owner = await loadOwner(slug);
  if ("error" in owner) return { error: owner.error };
  const { tenant, user } = owner;

  const parsed = firebaseConnectSchema.safeParse({
    serviceAccount: String(formData.get("serviceAccount") || ""),
    storageBucket: String(formData.get("storageBucket") || "").trim(),
    clientConfig: String(formData.get("clientConfig") || "").trim(),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your input." };
  }

  // Validate the credential against the live project before storing it.
  const verify = await verifyServiceAccount(
    parsed.data.serviceAccount,
    parsed.data.storageBucket || undefined,
  );
  if (!verify.ok || !verify.projectId) {
    return { error: verify.error || "Could not connect to that Firebase project." };
  }

  let clientConfig: Prisma.InputJsonValue | undefined;
  if (parsed.data.clientConfig) {
    try {
      clientConfig = JSON.parse(parsed.data.clientConfig);
    } catch {
      return { error: "Web config must be valid JSON (or leave it blank)." };
    }
  }

  const sealed = seal(parsed.data.serviceAccount);
  const data = {
    projectId: verify.projectId,
    storageBucket: parsed.data.storageBucket || null,
    clientConfig,
    ciphertext: sealed.ciphertext,
    iv: sealed.iv,
    authTag: sealed.authTag,
    wrappedKey: sealed.wrappedKey,
    status: "ACTIVE" as const,
    lastVerifiedAt: new Date(),
    lastError: null,
  };

  await prisma.firebaseCredential.upsert({
    where: { tenantId: tenant.id },
    update: data,
    create: { tenantId: tenant.id, ...data },
  });

  // Drop any cached Admin app so the new credentials take effect immediately.
  await disposeTenantApp(tenant.id);

  await writeAudit({
    action: "firebase.connect",
    tenantId: tenant.id,
    actorId: user.id,
    meta: { projectId: verify.projectId },
  });

  revalidatePath(`/${slug}`, "layout");
  return { ok: true };
}

export async function updateBrandingAction(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const owner = await loadOwner(slug);
  if ("error" in owner) return { error: owner.error };
  const { tenant, user } = owner;

  const parsed = brandingSchema.safeParse({
    name: String(formData.get("name") || "").trim(),
    primary: String(formData.get("primary") || "").trim(),
    accent: String(formData.get("accent") || "").trim(),
    accent2: String(formData.get("accent2") || "").trim(),
    logoUrl: String(formData.get("logoUrl") || "").trim(),
    headingFont: String(formData.get("headingFont") || "Sora"),
    cornerStyle: String(formData.get("cornerStyle") || "rounded"),
    shapeIntensity: String(formData.get("shapeIntensity") || "high"),
    density: String(formData.get("density") || "balanced"),
    shellWidth: String(formData.get("shellWidth") || "wide"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your design." };
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      name: parsed.data.name,
      logoUrl: parsed.data.logoUrl || null,
      theme: {
        primary: parsed.data.primary,
        accent: parsed.data.accent,
        accent2: parsed.data.accent2,
        headingFont: parsed.data.headingFont,
        cornerStyle: parsed.data.cornerStyle,
        shapeIntensity: parsed.data.shapeIntensity,
        density: parsed.data.density,
        shellWidth: parsed.data.shellWidth,
      } as Prisma.InputJsonValue,
    },
  });

  await writeAudit({
    action: "tenant.branding",
    tenantId: tenant.id,
    actorId: user.id,
  });

  revalidatePath(`/${slug}`, "layout");
  return { ok: true };
}

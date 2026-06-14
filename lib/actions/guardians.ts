"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canManage } from "@/lib/tenant";

export type FormState = { error?: string; ok?: boolean } | undefined;

async function loadManager(slug: string) {
  const user = await requireUser();
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return { error: "Workspace not found." as const };
  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
  });
  if (!membership || !canManage(membership.role)) {
    return { error: "Only teachers and admins can manage guardians." as const };
  }
  return { tenant };
}

export async function addGuardianContactAction(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadManager(slug);
  if ("error" in ctx) return { error: ctx.error };

  const studentId = String(formData.get("studentId") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const relationship = String(formData.get("relationship") || "").trim();
  if (!studentId || !name || !email.includes("@")) {
    return { error: "Choose a student and add a guardian name and email." };
  }

  const student = await prisma.membership.findUnique({ where: { id: studentId } });
  if (!student || student.tenantId !== ctx.tenant.id || student.role !== "STUDENT") {
    return { error: "Choose a student in this workspace." };
  }

  await prisma.guardianContact.create({
    data: {
      tenantId: ctx.tenant.id,
      studentUserId: student.userId,
      name,
      email,
      relationship,
    },
  });
  revalidatePath(`/${slug}/people`);
  return { ok: true };
}

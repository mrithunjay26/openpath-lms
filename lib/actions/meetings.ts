"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/tenant";
import {
  markAttendance,
  type AttendanceStatus,
} from "@/lib/firebase-attendance";

export type FormState = { error?: string; ok?: boolean } | undefined;

async function loadStaff(slug: string) {
  const user = await requireUser();
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { firebase: { select: { status: true } } },
  });
  if (!tenant) return { error: "Workspace not found." as const };
  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
  });
  if (!membership || !can(membership.role, "grade.write")) {
    return { error: "You don't have permission to mark attendance." as const };
  }
  if (tenant.firebase?.status !== "ACTIVE") {
    return { error: "Firebase is not connected." as const };
  }
  return { tenant };
}

export async function markAttendanceAction(
  slug: string,
  courseId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadStaff(slug);
  if ("error" in ctx) return { error: ctx.error };
  const status = String(formData.get("status") || "PRESENT") as AttendanceStatus;
  if (!["PRESENT", "LATE", "ABSENT"].includes(status)) {
    return { error: "Pick a valid attendance status." };
  }

  await markAttendance(ctx.tenant.id, courseId, {
    userId: String(formData.get("userId") || ""),
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    status,
    meetingAt:
      String(formData.get("meetingAt") || "") || new Date().toISOString(),
    note: String(formData.get("note") || ""),
  });
  revalidatePath(`/${slug}/meetings`);
  return { ok: true };
}

export async function markAttendanceDirectAction(
  slug: string,
  courseId: string,
  formData: FormData,
): Promise<void> {
  await markAttendanceAction(slug, courseId, undefined, formData);
}

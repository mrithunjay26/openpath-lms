"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/tenant";
import {
  announcementSchema,
  assignmentSchema,
  courseSchema,
} from "@/lib/validations";
import {
  addModuleItem,
  coursesTag,
  createAnnouncement,
  createAssignment,
  createCourse,
  createModule,
  enrollUser,
  gradeSubmission,
  setSubmissionFile,
  type ModuleItemType,
} from "@/lib/firebase-data";
import { uploadFile } from "@/lib/firebase-files";

export type FormState = { error?: string; ok?: boolean } | undefined;

async function loadCtx(slug: string) {
  const user = await requireUser();
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { firebase: { select: { status: true, storageBucket: true } } },
  });
  if (!tenant) return { error: "Workspace not found." as const };
  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
  });
  if (!membership) {
    return { error: "You are not a member of this workspace." as const };
  }
  return { user, tenant, role: membership.role };
}

function connected(tenant: { firebase: { status: string } | null }) {
  return tenant.firebase?.status === "ACTIVE";
}

export async function createCourseAction(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadCtx(slug);
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx.role, "course.create"))
    return { error: "Only Admins and Teachers can create courses." };
  if (!connected(ctx.tenant)) {
    return { error: "Connect your Firebase project before creating courses." };
  }

  const parsed = courseSchema.safeParse({
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || ""),
    term: String(formData.get("term") || ""),
    meetingLink: String(formData.get("meetingLink") || ""),
    skills: String(formData.get("skills") || ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the course details." };
  }

  let courseId: string;
  try {
    courseId = await createCourse(ctx.tenant.id, {
      name: parsed.data.name,
      description: parsed.data.description,
      term: parsed.data.term,
      meetingLink: parsed.data.meetingLink,
      skills: (parsed.data.skills || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    // Enroll the creator as a teacher of the course.
    await enrollUser(ctx.tenant.id, courseId, {
      userId: ctx.user.id,
      name: ctx.user.name ?? "",
      email: ctx.user.email ?? "",
      role: "TEACHER",
    });
  } catch (e) {
    return { error: firebaseError(e) };
  }

  revalidateTag(coursesTag(ctx.tenant.id));
  revalidatePath(`/${slug}/courses`);
  redirect(`/${slug}/courses/${courseId}`);
}

export async function createAssignmentAction(
  slug: string,
  courseId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadCtx(slug);
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx.role, "content.author"))
    return { error: "You don't have permission to add content here." };

  const parsed = assignmentSchema.safeParse({
    title: String(formData.get("title") || ""),
    details: String(formData.get("details") || ""),
    points: formData.get("points") || undefined,
    dueAt: String(formData.get("dueAt") || ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the assignment." };
  }

  try {
    await createAssignment(ctx.tenant.id, courseId, {
      title: parsed.data.title,
      details: parsed.data.details || "",
      points: parsed.data.points ?? null,
      dueAt: parsed.data.dueAt || null,
    });
  } catch (e) {
    return { error: firebaseError(e) };
  }

  revalidatePath(`/${slug}/courses/${courseId}`);
  return { ok: true };
}

export async function createAnnouncementAction(
  slug: string,
  courseId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadCtx(slug);
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx.role, "content.author"))
    return { error: "You don't have permission to post here." };

  const parsed = announcementSchema.safeParse({
    title: String(formData.get("title") || ""),
    body: String(formData.get("body") || ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the announcement." };
  }

  try {
    await createAnnouncement(ctx.tenant.id, courseId, {
      title: parsed.data.title,
      body: parsed.data.body,
      authorName: ctx.user.name ?? ctx.user.email ?? "Teacher",
    });
  } catch (e) {
    return { error: firebaseError(e) };
  }

  revalidatePath(`/${slug}/courses/${courseId}`);
  return { ok: true };
}

export async function submitAssignmentAction(
  slug: string,
  courseId: string,
  assignmentId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadCtx(slug);
  if ("error" in ctx) return { error: ctx.error };
  if (!connected(ctx.tenant) || !ctx.tenant.firebase?.storageBucket) {
    return {
      error:
        "File submissions need a Storage bucket configured for this workspace.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to submit." };
  }

  const folder = `submissions/${courseId}/${assignmentId}/${ctx.user.id}`;
  try {
    await uploadFile(ctx.tenant.id, folder, file);
    await setSubmissionFile(ctx.tenant.id, courseId, assignmentId, ctx.user.id, {
      studentName: ctx.user.name ?? "",
      studentEmail: ctx.user.email ?? "",
      fileName: file.name,
      filePath: `${folder}/${file.name}`,
    });
  } catch (e) {
    return { error: firebaseError(e) };
  }

  revalidatePath(`/${slug}/courses/${courseId}/assignments/${assignmentId}`);
  return { ok: true };
}

export async function gradeSubmissionAction(
  slug: string,
  courseId: string,
  assignmentId: string,
  studentId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadCtx(slug);
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx.role, "grade.write"))
    return { error: "You don't have permission to grade." };

  const gradeRaw = String(formData.get("grade") || "").trim();
  const grade = gradeRaw === "" ? null : Number(gradeRaw);
  if (grade !== null && Number.isNaN(grade)) {
    return { error: "Grade must be a number." };
  }

  try {
    const strengths = String(formData.get("feedbackStrengths") || "").trim();
    const needs = String(formData.get("feedbackNeeds") || "").trim();
    const next = String(formData.get("feedbackNext") || "").trim();
    const legacyFeedback = String(formData.get("feedback") || "").trim();
    await gradeSubmission(ctx.tenant.id, courseId, assignmentId, studentId, {
      grade,
      feedback:
        legacyFeedback ||
        [strengths, needs, next].filter(Boolean).join("\n\n"),
      feedbackStrengths: strengths,
      feedbackNeeds: needs,
      feedbackNext: next,
      skillTags: String(formData.get("skillTags") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  } catch (e) {
    return { error: firebaseError(e) };
  }

  revalidatePath(`/${slug}/courses/${courseId}/assignments/${assignmentId}`);
  return { ok: true };
}

export async function createModuleAction(
  slug: string,
  courseId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadCtx(slug);
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx.role, "content.author"))
    return { error: "You don't have permission to add content here." };

  const title = String(formData.get("title") || "").trim();
  if (title.length < 2) return { error: "Give the module a title." };

  try {
    await createModule(ctx.tenant.id, courseId, title);
  } catch (e) {
    return { error: firebaseError(e) };
  }
  revalidatePath(`/${slug}/courses/${courseId}/modules`);
  return { ok: true };
}

export async function addModuleItemAction(
  slug: string,
  courseId: string,
  moduleId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadCtx(slug);
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx.role, "content.author"))
    return { error: "You don't have permission to add content here." };

  const type = (String(formData.get("type") || "lesson") as ModuleItemType);
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Give the item a title." };

  try {
    await addModuleItem(ctx.tenant.id, courseId, moduleId, {
      type,
      title,
      content: String(formData.get("content") || ""),
      url: String(formData.get("url") || "").trim(),
    });
  } catch (e) {
    return { error: firebaseError(e) };
  }
  revalidatePath(`/${slug}/courses/${courseId}/modules`);
  return { ok: true };
}

export async function addLessonFromDraftAction(
  slug: string,
  courseId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadCtx(slug);
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx.role, "content.author"))
    return { error: "You don't have permission to add content here." };

  const moduleId = String(formData.get("moduleId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  if (!moduleId) return { error: "Choose a module." };
  if (!title) return { error: "Give the lesson a title." };
  if (!content) return { error: "Add lesson content." };

  try {
    await addModuleItem(ctx.tenant.id, courseId, moduleId, {
      type: "lesson",
      title,
      content,
    });
  } catch (e) {
    return { error: firebaseError(e) };
  }
  revalidatePath(`/${slug}/courses/${courseId}/modules`);
  return { ok: true };
}

function firebaseError(e: unknown): string {
  const msg = e instanceof Error ? e.message : "Something went wrong.";
  return `Firebase error: ${msg}`;
}

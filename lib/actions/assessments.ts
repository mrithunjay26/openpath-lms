"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/tenant";
import {
  createAssessment,
  getAssessment,
  gradeAttemptManual,
  submitAttempt,
  type Question,
  type QuestionType,
} from "@/lib/firebase-assessments";

export type FormState = { error?: string; ok?: boolean } | undefined;

async function loadCtx(slug: string) {
  const user = await requireUser();
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { firebase: { select: { status: true } } },
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

const TYPES: QuestionType[] = ["mcq", "multi", "truefalse", "short"];

function normalizeQuestions(raw: unknown): Question[] | null {
  if (!Array.isArray(raw)) return null;
  const out: Question[] = [];
  raw.forEach((q, i) => {
    const obj = q as Record<string, unknown>;
    const type = TYPES.includes(obj.type as QuestionType)
      ? (obj.type as QuestionType)
      : "mcq";
    out.push({
      id: typeof obj.id === "string" ? obj.id : `q${i}`,
      type,
      prompt: String(obj.prompt ?? ""),
      options: Array.isArray(obj.options) ? obj.options.map(String) : [],
      correct: Array.isArray(obj.correct) ? obj.correct.map(Number) : [],
      points: Number(obj.points) || 1,
    });
  });
  return out;
}

export async function createAssessmentAction(
  slug: string,
  courseId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadCtx(slug);
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx.role, "content.author")) {
    return { error: "You don't have permission to add content here." };
  }

  const title = String(formData.get("title") || "").trim();
  if (title.length < 2) return { error: "Give the quiz a title." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(String(formData.get("questions") || "[]"));
  } catch {
    return { error: "Could not read the questions." };
  }
  const questions = normalizeQuestions(parsed);
  if (!questions || questions.length === 0) {
    return { error: "Add at least one question." };
  }
  if (questions.some((q) => q.prompt.trim().length === 0)) {
    return { error: "Every question needs a prompt." };
  }

  const timeLimitRaw = String(formData.get("timeLimit") || "").trim();
  try {
    await createAssessment(ctx.tenant.id, courseId, {
      title,
      description: String(formData.get("description") || ""),
      dueAt: String(formData.get("dueAt") || "") || null,
      timeLimit: timeLimitRaw ? Number(timeLimitRaw) : null,
      questions,
    });
  } catch (e) {
    return { error: `Firebase error: ${e instanceof Error ? e.message : "failed"}` };
  }

  revalidatePath(`/${slug}/courses/${courseId}/assessments`);
  return { ok: true };
}

export async function submitAttemptAction(
  slug: string,
  courseId: string,
  assessmentId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadCtx(slug);
  if ("error" in ctx) return { error: ctx.error };
  if (ctx.tenant.firebase?.status !== "ACTIVE") {
    return { error: "This workspace isn't connected to Firebase yet." };
  }

  let answers: Record<string, number[] | string>;
  try {
    answers = JSON.parse(String(formData.get("answers") || "{}"));
  } catch {
    return { error: "Could not read your answers." };
  }

  const assessment = await getAssessment(ctx.tenant.id, courseId, assessmentId);
  if (!assessment) return { error: "Quiz not found." };

  try {
    await submitAttempt(ctx.tenant.id, courseId, assessmentId, ctx.user.id, {
      studentName: ctx.user.name ?? "",
      studentEmail: ctx.user.email ?? "",
      answers,
      questions: assessment.questions,
    });
  } catch (e) {
    return { error: `Firebase error: ${e instanceof Error ? e.message : "failed"}` };
  }

  revalidatePath(`/${slug}/courses/${courseId}/assessments/${assessmentId}`);
  return { ok: true };
}

export async function gradeAttemptAction(
  slug: string,
  courseId: string,
  assessmentId: string,
  studentId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadCtx(slug);
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx.role, "grade.write")) {
    return { error: "You don't have permission to grade." };
  }

  const manual = Number(String(formData.get("manualScore") || "0"));
  if (Number.isNaN(manual)) return { error: "Score must be a number." };

  try {
    await gradeAttemptManual(
      ctx.tenant.id,
      courseId,
      assessmentId,
      studentId,
      manual,
    );
  } catch (e) {
    return { error: `Firebase error: ${e instanceof Error ? e.message : "failed"}` };
  }

  revalidatePath(`/${slug}/courses/${courseId}/assessments/${assessmentId}`);
  return { ok: true };
}

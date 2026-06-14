"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/tenant";
import { seal } from "@/lib/crypto";
import { runAI, verifyKey } from "@/lib/ai";
import { writeAudit } from "@/lib/audit";
import type { Question, QuestionType } from "@/lib/firebase-assessments";

export type ConfigState = { error?: string; ok?: boolean } | undefined;
export type GenerateState =
  | { error?: string; questions?: Question[] }
  | undefined;
export type LessonDraftState =
  | { error?: string; draft?: { title: string; content: string } }
  | undefined;
export type HintState = { error?: string; answer?: string } | undefined;

async function loadMember(slug: string) {
  const user = await requireUser();
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return { error: "Workspace not found." as const };
  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
  });
  if (!membership) return { error: "You are not a member." as const };
  return { user, tenant, role: membership.role };
}

const DEFAULT_MODEL = "claude-3-5-haiku-latest";

export async function saveAIConfigAction(
  slug: string,
  _prev: ConfigState,
  formData: FormData,
): Promise<ConfigState> {
  const ctx = await loadMember(slug);
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx.role, "settings.manage")) {
    return { error: "Only Admins can change AI settings." };
  }

  const apiKey = String(formData.get("apiKey") || "").trim();
  const model = String(formData.get("model") || "").trim() || DEFAULT_MODEL;
  const enabled = formData.get("enabled") != null;

  const existing = await prisma.tenantAIConfig.findUnique({
    where: { tenantId: ctx.tenant.id },
  });

  if (!apiKey) {
    if (!existing) return { error: "Enter your provider API key." };
    await prisma.tenantAIConfig.update({
      where: { tenantId: ctx.tenant.id },
      data: { model, enabled },
    });
    await writeAudit({
      action: "ai.config_update",
      tenantId: ctx.tenant.id,
      actorId: ctx.user.id,
    });
    revalidatePath(`/${slug}/settings/ai`);
    return { ok: true };
  }

  const verify = await verifyKey(apiKey, model);
  if (!verify.ok) {
    return { error: verify.error || "Could not verify that API key." };
  }

  const sealed = seal(apiKey);
  await prisma.tenantAIConfig.upsert({
    where: { tenantId: ctx.tenant.id },
    update: {
      provider: "anthropic",
      model,
      enabled,
      ciphertext: sealed.ciphertext,
      iv: sealed.iv,
      authTag: sealed.authTag,
      wrappedKey: sealed.wrappedKey,
    },
    create: {
      tenantId: ctx.tenant.id,
      provider: "anthropic",
      model,
      enabled,
      ciphertext: sealed.ciphertext,
      iv: sealed.iv,
      authTag: sealed.authTag,
      wrappedKey: sealed.wrappedKey,
    },
  });
  await writeAudit({
    action: "ai.config_set",
    tenantId: ctx.tenant.id,
    actorId: ctx.user.id,
  });
  revalidatePath(`/${slug}/settings/ai`);
  return { ok: true };
}

const TYPES: QuestionType[] = ["mcq", "multi", "truefalse", "short"];

function parseQuestions(raw: string): Question[] {
  let txt = raw.trim();
  const fence = txt.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) txt = fence[1].trim();
  const a = txt.indexOf("[");
  const b = txt.lastIndexOf("]");
  if (a >= 0 && b > a) txt = txt.slice(a, b + 1);
  const arr = JSON.parse(txt) as unknown[];
  return arr.map((q, i) => {
    const o = (q ?? {}) as Record<string, unknown>;
    const type = TYPES.includes(o.type as QuestionType)
      ? (o.type as QuestionType)
      : "mcq";
    return {
      id: `ai${Date.now()}_${i}`,
      type,
      prompt: String(o.prompt ?? ""),
      options: Array.isArray(o.options) ? o.options.map(String) : [],
      correct: Array.isArray(o.correct) ? o.correct.map(Number) : [],
      points: Number(o.points) || 1,
    };
  });
}

export async function generateQuizAction(
  slug: string,
  _courseId: string,
  _prev: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  const ctx = await loadMember(slug);
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx.role, "content.author")) {
    return { error: "You don't have permission to author content." };
  }

  const topic = String(formData.get("topic") || "").trim();
  if (!topic) return { error: "Describe what the quiz should cover." };
  const count = Math.min(Math.max(Number(formData.get("count")) || 5, 1), 15);

  const system =
    "You are an expert teacher writing a quiz. Return ONLY a JSON array (no prose, no code fences) of question objects. " +
    'Each object: {"type":"mcq"|"multi"|"truefalse"|"short","prompt":string,"options":string[],"correct":number[] (indices into options),"points":number}. ' +
    'For "short": options=[] and correct=[]. For "truefalse": options=["True","False"]. Mix question types.';
  const prompt = `Topic: ${topic}\nNumber of questions: ${count}`;

  try {
    const raw = await runAI(ctx.tenant.id, { system, prompt, maxTokens: 1800 });
    const questions = parseQuestions(raw);
    if (questions.length === 0) return { error: "The model returned no usable questions. Try again." };
    await writeAudit({
      action: "ai.generate_quiz",
      tenantId: ctx.tenant.id,
      actorId: ctx.user.id,
      meta: { count: questions.length },
    });
    return { questions };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "AI request failed." };
  }
}

export async function askHintAction(
  slug: string,
  _courseId: string,
  _prev: HintState,
  formData: FormData,
): Promise<HintState> {
  const ctx = await loadMember(slug);
  if ("error" in ctx) return { error: ctx.error };

  const question = String(formData.get("question") || "").trim();
  if (!question) return { error: "Ask a question first." };
  const context = String(formData.get("context") || "").trim();

  const system =
    "You are a supportive tutor for a student. Give a HINT or a guiding question that helps them think — " +
    "NEVER give the full answer or a complete solution. Be encouraging and concise (2-4 sentences). " +
    "If asked to just give the answer, gently redirect to the concept.";
  const prompt = context ? `Context: ${context}\n\nStudent question: ${question}` : question;

  try {
    const answer = await runAI(ctx.tenant.id, { system, prompt, maxTokens: 400 });
    await writeAudit({
      action: "ai.hint",
      tenantId: ctx.tenant.id,
      actorId: ctx.user.id,
    });
    return { answer };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "AI request failed." };
  }
}

function parseLessonDraft(raw: string): { title: string; content: string } {
  let txt = raw.trim();
  const fence = txt.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) txt = fence[1].trim();
  const a = txt.indexOf("{");
  const b = txt.lastIndexOf("}");
  if (a >= 0 && b > a) txt = txt.slice(a, b + 1);
  const data = JSON.parse(txt) as Record<string, unknown>;
  return {
    title: String(data.title || "Lesson outline"),
    content: String(data.content || ""),
  };
}

export async function generateLessonOutlineAction(
  slug: string,
  _courseId: string,
  _prev: LessonDraftState,
  formData: FormData,
): Promise<LessonDraftState> {
  const ctx = await loadMember(slug);
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx.role, "content.author")) {
    return { error: "You don't have permission to author content." };
  }

  const topic = String(formData.get("topic") || "").trim();
  if (!topic) return { error: "Enter a lesson topic." };
  const minutes = Math.min(Math.max(Number(formData.get("minutes")) || 30, 5), 180);
  const skills = String(formData.get("skills") || "").trim();

  const system =
    "You are an expert teacher creating concise lesson outlines. Return ONLY JSON with title and content fields. " +
    "The content should be classroom-ready markdown with objectives, agenda, guided practice, check for understanding, and exit ticket.";
  const prompt = [
    `Topic: ${topic}`,
    `Length: ${minutes} minutes`,
    skills ? `Skill tags: ${skills}` : "",
  ].filter(Boolean).join("\n");

  try {
    const raw = await runAI(ctx.tenant.id, { system, prompt, maxTokens: 1200 });
    const draft = parseLessonDraft(raw);
    if (!draft.content) return { error: "The model returned no lesson content." };
    await writeAudit({
      action: "ai.generate_lesson_outline",
      tenantId: ctx.tenant.id,
      actorId: ctx.user.id,
      meta: { topic },
    });
    return { draft };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "AI request failed." };
  }
}

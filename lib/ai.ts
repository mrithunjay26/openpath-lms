import "server-only";
import { prisma } from "@/lib/prisma";
import { open } from "@/lib/crypto";

/**
 * Tenant-supplied AI. Each workspace brings its own provider key (Anthropic by
 * default), stored AES-256-GCM encrypted and decrypted server-side on demand.
 * Keys never reach the browser; all calls happen here.
 */

export type TenantAI = { provider: string; model: string; apiKey: string };

export async function getTenantAI(tenantId: string): Promise<TenantAI | null> {
  const cfg = await prisma.tenantAIConfig.findUnique({ where: { tenantId } });
  if (!cfg || !cfg.enabled) return null;
  const apiKey = open({
    ciphertext: cfg.ciphertext,
    iv: cfg.iv,
    authTag: cfg.authTag,
    wrappedKey: cfg.wrappedKey,
  });
  return { provider: cfg.provider, model: cfg.model, apiKey };
}

export async function aiConfigStatus(tenantId: string) {
  return prisma.tenantAIConfig.findUnique({
    where: { tenantId },
    select: { enabled: true, provider: true, model: true, updatedAt: true },
  });
}

async function runAnthropic(opts: {
  apiKey: string;
  model: string;
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": opts.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI provider error ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { content?: Array<{ text?: string }> };
  return (data.content ?? [])
    .map((b) => b.text ?? "")
    .join("")
    .trim();
}

/** Run a prompt against the tenant's configured provider. */
export async function runAI(
  tenantId: string,
  opts: { system: string; prompt: string; maxTokens?: number },
): Promise<string> {
  const ai = await getTenantAI(tenantId);
  if (!ai) throw new Error("AI isn't enabled for this workspace.");
  // Only Anthropic is wired today; the config carries provider for the future.
  return runAnthropic({
    apiKey: ai.apiKey,
    model: ai.model,
    system: opts.system,
    prompt: opts.prompt,
    maxTokens: opts.maxTokens,
  });
}

/** Validate a key with a tiny call before we store it. */
export async function verifyKey(
  apiKey: string,
  model: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await runAnthropic({
      apiKey,
      model,
      system: "Reply with the single word OK.",
      prompt: "ping",
      maxTokens: 8,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "verification failed" };
  }
}

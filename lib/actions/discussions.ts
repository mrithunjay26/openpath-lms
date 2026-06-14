"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isStaff } from "@/lib/tenant";
import {
  addPost,
  createDiscussion,
  deletePost,
} from "@/lib/firebase-discussions";

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
  if (!membership) return { error: "You are not a member." as const };
  if (tenant.firebase?.status !== "ACTIVE")
    return { error: "This workspace isn't connected to Firebase yet." as const };
  return { user, tenant, role: membership.role };
}

export async function createDiscussionAction(
  slug: string,
  courseId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadCtx(slug);
  if ("error" in ctx) return { error: ctx.error };
  const title = String(formData.get("title") || "").trim();
  if (title.length < 2) return { error: "Give your discussion a title." };

  try {
    await createDiscussion(ctx.tenant.id, courseId, {
      title,
      authorName: ctx.user.name ?? ctx.user.email ?? "Member",
    });
  } catch (e) {
    return { error: `Firebase error: ${e instanceof Error ? e.message : "failed"}` };
  }
  revalidatePath(`/${slug}/courses/${courseId}/discussions`);
  return { ok: true };
}

export async function addPostAction(
  slug: string,
  courseId: string,
  discussionId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadCtx(slug);
  if ("error" in ctx) return { error: ctx.error };
  const body = String(formData.get("body") || "").trim();
  if (!body) return { error: "Write a reply first." };

  try {
    await addPost(ctx.tenant.id, courseId, discussionId, {
      authorId: ctx.user.id,
      authorName: ctx.user.name ?? ctx.user.email ?? "Member",
      body,
    });
  } catch (e) {
    return { error: `Firebase error: ${e instanceof Error ? e.message : "failed"}` };
  }
  revalidatePath(`/${slug}/courses/${courseId}/discussions/${discussionId}`);
  return { ok: true };
}

export async function deletePostAction(
  slug: string,
  courseId: string,
  discussionId: string,
  postId: string,
): Promise<void> {
  const ctx = await loadCtx(slug);
  if ("error" in ctx) return;
  if (!isStaff(ctx.role)) return; // moderation: staff only
  try {
    await deletePost(ctx.tenant.id, courseId, discussionId, postId);
  } catch {
    // ignore
  }
  revalidatePath(`/${slug}/courses/${courseId}/discussions/${discussionId}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { can, isStaff } from "@/lib/tenant";
import {
  createWorkspaceMessage,
  setMessageHidden,
  type MessageAudience,
} from "@/lib/firebase-messages";
import {
  createDirectConversation,
  createGroupConversation,
  getChatConversation,
  postChatMessage,
  toggleReaction,
} from "@/lib/firebase-chats";
import { notifyWorkspaceMembers } from "@/lib/email";

export type FormState = { error?: string; ok?: boolean; message?: string } | undefined;

async function loadMember(slug: string) {
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
  if (tenant.firebase?.status !== "ACTIVE") {
    return { error: "Firebase is not connected." as const };
  }
  return { user, tenant, role: membership.role };
}

export async function postMessageAction(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadMember(slug);
  if ("error" in ctx) return { error: ctx.error };
  if (!can(ctx.role, "content.author")) {
    return { error: "Only staff can post workspace messages." };
  }
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const audience = String(formData.get("audience") || "all") as MessageAudience;
  if (!title || !body) return { error: "Add a title and message." };
  if (!["all", "students", "staff"].includes(audience)) {
    return { error: "Pick a valid audience." };
  }

  await createWorkspaceMessage(ctx.tenant.id, {
    title,
    body,
    audience,
    authorId: ctx.user.id,
    authorName: ctx.user.name ?? ctx.user.email ?? "OpenPath",
  });
  const email = await notifyWorkspaceMembers({
    tenantId: ctx.tenant.id,
    audience,
    subject: title,
    text: body,
  });
  revalidatePath(`/${slug}/messages`);
  return {
    ok: true,
    message: email.skipped ? "Message posted." : `Message posted and emailed to ${email.sent}.`,
  };
}

export async function postMessageDirectAction(
  slug: string,
  formData: FormData,
): Promise<void> {
  await postMessageAction(slug, undefined, formData);
}

export async function moderateMessageAction(
  slug: string,
  messageId: string,
  hidden: boolean,
) {
  const ctx = await loadMember(slug);
  if ("error" in ctx) return;
  if (!isStaff(ctx.role)) return;
  await setMessageHidden(ctx.tenant.id, messageId, hidden);
  revalidatePath(`/${slug}/messages`);
}

export async function sendChatMessageAction(
  slug: string,
  conversationId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadMember(slug);
  if ("error" in ctx) return { error: ctx.error };

  const conversation = await getChatConversation(ctx.tenant.id, conversationId);
  if (!conversation) return { error: "That conversation doesn't exist." };
  if (
    conversation.kind !== "general" &&
    conversationId !== "staff" &&
    conversation.memberIds.length > 0 &&
    !conversation.memberIds.includes(ctx.user.id)
  ) {
    return { error: "You don't have access to that chat." };
  }

  const body = String(formData.get("body") || "").trim();
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (!body && files.length === 0) {
    return { error: "Write a message or attach a file." };
  }

  try {
    await postChatMessage(ctx.tenant.id, conversationId, {
      senderId: ctx.user.id,
      senderName: ctx.user.name ?? ctx.user.email ?? "OpenPath",
      body,
      files,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not send the message." };
  }

  revalidatePath(`/${slug}/messages`);
  return { ok: true };
}

export async function createDirectConversationAction(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadMember(slug);
  if ("error" in ctx) return { error: ctx.error };

  const otherUserId = String(formData.get("memberId") || "").trim();
  if (!otherUserId) return { error: "Choose someone to message." };
  if (otherUserId === ctx.user.id) return { error: "Pick another person." };

  const otherMembership = await prisma.membership.findFirst({
    where: { tenantId: ctx.tenant.id, userId: otherUserId, status: "ACTIVE" },
    include: { user: true },
  });
  if (!otherMembership) return { error: "That person is not in this workspace." };

  const title = [
    ctx.user.name ?? ctx.user.email ?? "You",
    otherMembership.user.name ?? otherMembership.user.email ?? "Member",
  ]
    .filter(Boolean)
    .join(" and ");

  const conversationId = await createDirectConversation(ctx.tenant.id, {
    memberIds: [ctx.user.id, otherUserId],
    title,
    createdById: ctx.user.id,
  });
  revalidatePath(`/${slug}/messages`);
  redirect(`/${slug}/messages?chat=${conversationId}`);
}

export async function createGroupConversationAction(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadMember(slug);
  if ("error" in ctx) return { error: ctx.error };

  const title = String(formData.get("title") || "").trim();
  const memberIds = formData
    .getAll("memberIds")
    .map(String)
    .filter((v) => v && v !== ctx.user.id);
  if (title.length < 2) return { error: "Give the group a title." };
  if (memberIds.length === 0) return { error: "Select at least one person." };

  const conversationId = await createGroupConversation(ctx.tenant.id, {
    title,
    memberIds: [ctx.user.id, ...memberIds],
    createdById: ctx.user.id,
  });
  revalidatePath(`/${slug}/messages`);
  redirect(`/${slug}/messages?chat=${conversationId}`);
}

export async function reactToMessageAction(
  slug: string,
  conversationId: string,
  messageId: string,
  emoji: string,
) {
  const ctx = await loadMember(slug);
  if ("error" in ctx) return;
  await toggleReaction(ctx.tenant.id, conversationId, messageId, emoji, ctx.user.id);
  revalidatePath(`/${slug}/messages`);
}

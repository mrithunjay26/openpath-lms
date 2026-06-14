import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getChatConversation } from "@/lib/firebase-chats";
import {
  clearConversationPresence,
  getConversationPresence,
  touchConversationPresence,
} from "@/lib/firebase-realtime";

async function loadContext(workspace: string) {
  const user = await getCurrentUser();
  if (!user?.id) return { error: "Not signed in." as const, status: 401 as const };
  const tenant = await prisma.tenant.findUnique({
    where: { slug: workspace },
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspace: string }> },
) {
  const { workspace } = await params;
  const ctx = await loadContext(workspace);
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status ?? 403 });
  }

  const conversationId = new URL(request.url).searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId." }, { status: 400 });
  }

  const conversation = await getChatConversation(ctx.tenant.id, conversationId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }
  if (
    conversation.kind !== "general" &&
    conversationId !== "staff" &&
    conversation.memberIds.length > 0 &&
    !conversation.memberIds.includes(ctx.user.id)
  ) {
    return NextResponse.json({ error: "You don't have access to that chat." }, { status: 403 });
  }

  const state = await getConversationPresence(ctx.tenant.id, conversationId);
  return NextResponse.json(state);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspace: string }> },
) {
  const { workspace } = await params;
  const ctx = await loadContext(workspace);
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status ?? 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { conversationId?: string; typing?: boolean; leave?: boolean }
    | null;
  const conversationId = body?.conversationId?.trim();
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId." }, { status: 400 });
  }

  const conversation = await getChatConversation(ctx.tenant.id, conversationId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }
  if (
    conversation.kind !== "general" &&
    conversationId !== "staff" &&
    conversation.memberIds.length > 0 &&
    !conversation.memberIds.includes(ctx.user.id)
  ) {
    return NextResponse.json({ error: "You don't have access to that chat." }, { status: 403 });
  }

  if (body?.leave) {
    await clearConversationPresence(ctx.tenant.id, conversationId, ctx.user.id);
  } else {
    await touchConversationPresence(ctx.tenant.id, conversationId, ctx.user, body?.typing ? "typing" : "online");
  }

  const state = await getConversationPresence(ctx.tenant.id, conversationId);
  return NextResponse.json({ ok: true, ...state });
}

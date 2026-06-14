import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Hash,
  MessageCircleMore,
  MoreHorizontal,
  Users,
} from "lucide-react";
import type { MembershipRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/tenant";
import {
  createDirectConversationAction,
  createGroupConversationAction,
  reactToMessageAction,
} from "@/lib/actions/messages";
import {
  getChatConversation,
  listChatMessages,
  listWorkspaceChats,
  type ChatConversation,
  type ChatMessage,
} from "@/lib/firebase-chats";
import { getConversationPresence } from "@/lib/firebase-realtime";
import { PageHeader } from "@/components/workspace/page-header";
import { NotConnected } from "@/components/workspace/not-connected";
import { ModalForm } from "@/components/workspace/modal-form";
import { ChatComposer } from "@/components/workspace/chat-composer";
import { ChatPresence } from "@/components/workspace/chat-presence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime, cn } from "@/lib/utils";

const REACTIONS = ["👍", "❤️", "😂", "🎉"];

export default async function MessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ chat?: string }>;
}) {
  const { workspace } = await params;
  const { chat } = await searchParams;
  const ctx = await requireMembership(workspace);
  if (ctx.tenant.firebase?.status !== "ACTIVE") {
    return <NotConnected slug={workspace} isOwner={ctx.role === "OWNER"} />;
  }

  const [memberships, conversations] = await Promise.all([
    prisma.membership.findMany({
      where: { tenantId: ctx.tenant.id, status: "ACTIVE" },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    listWorkspaceChats(ctx.tenant.id, ctx.user.id),
  ]);

  const selectedId = chat || "general";
  const selected =
    conversations.find((c) => c.id === selectedId) ??
    (await getChatConversation(ctx.tenant.id, selectedId)) ??
    conversations[0];
  if (!selected) notFound();

  const [messages, presence] = await Promise.all([
    listChatMessages(ctx.tenant.id, selected.id, ctx.user.id),
    getConversationPresence(ctx.tenant.id, selected.id),
  ]);

  const memberMap = new Map(
    memberships.map((m) => [
      m.userId,
      {
        id: m.userId,
        name: m.user.name ?? "",
        email: m.user.email ?? "",
        image: m.user.image ?? null,
        role: m.role,
      },
    ]),
  );

  const selectedMembers = selected.memberIds
    .map((id) => memberMap.get(id))
    .filter(Boolean) as Array<{
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: MembershipRole;
  }>;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Conversation hub"
        title="Messages"
        description="Chat with individuals and groups, share files, and keep every conversation tied to your workspace."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ModalForm
              triggerLabel="Direct chat"
              triggerIcon="plus"
              triggerVariant="outline"
              triggerSize="sm"
              title="Start a direct chat"
              submitLabel="Start chat"
              action={createDirectConversationAction.bind(null, workspace)}
            >
              <div>
                <Label htmlFor="direct-member">Person</Label>
                <Select id="direct-member" name="memberId" defaultValue="">
                  <option value="" disabled>
                    Choose a teammate
                  </option>
                  {memberships
                    .filter((m) => m.userId !== ctx.user.id)
                    .map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user.name || m.user.email}
                      </option>
                    ))}
                </Select>
              </div>
            </ModalForm>
            <ModalForm
              triggerLabel="Group chat"
              triggerIcon="plus"
              triggerVariant="primary"
              triggerSize="sm"
              title="Create a group chat"
              submitLabel="Create group"
              action={createGroupConversationAction.bind(null, workspace)}
            >
              <div>
                <Label htmlFor="group-title">Title</Label>
                <Input id="group-title" name="title" placeholder="Project team" required />
              </div>
              <div>
                <Label htmlFor="group-members">Members</Label>
                <Select id="group-members" name="memberIds" multiple size={6}>
                  {memberships
                    .filter((m) => m.userId !== ctx.user.id)
                    .map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user.name || m.user.email}
                      </option>
                    ))}
                </Select>
                <p className="mt-1 text-xs text-muted">
                  Hold Ctrl or Cmd to select more than one person.
                </p>
              </div>
            </ModalForm>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageCircleMore className="size-5 text-primary" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-[var(--workspace-card-padding)]">
              {conversations.map((conversation) => {
                const active = conversation.id === selected.id;
                return (
                  <Link
                    key={conversation.id}
                    href={`/${workspace}/messages?chat=${conversation.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-[var(--radius-card)] border px-3 py-3 transition-colors",
                      active
                        ? "border-primary bg-primary/10"
                        : "border-line bg-background/50 hover:border-primary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-2xl",
                        conversation.id === "general"
                          ? "bg-primary/12 text-primary"
                          : "bg-teal/15 text-teal",
                      )}
                    >
                      {conversation.kind === "group" ? (
                        <Users className="size-4" />
                      ) : (
                        <Hash className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">
                        {conversationTitle(conversation, memberMap)}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {conversation.lastMessagePreview || "No messages yet"}
                      </p>
                    </div>
                    {conversation.id === selected.id ? (
                      <Badge tone="primary">Open</Badge>
                    ) : null}
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>People</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-[var(--workspace-card-padding)]">
              {memberships.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-2xl bg-background/50 px-3 py-2"
                >
                  <Avatar name={m.user.name} email={m.user.email} src={m.user.image} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {m.user.name || m.user.email}
                    </p>
                    <p className="truncate text-xs text-muted">{m.user.email}</p>
                  </div>
                  <Badge tone={m.role === "STUDENT" ? "neutral" : "primary"}>
                    {m.role}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-line pb-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge tone="primary">
                      {selected.kind === "direct"
                        ? "Direct"
                        : selected.kind === "group"
                          ? "Group"
                          : "General"}
                    </Badge>
                    <Badge tone="neutral">{messages.length} messages</Badge>
                  </div>
                  <CardTitle className="text-2xl">
                    {conversationTitle(selected, memberMap)}
                  </CardTitle>
                  <p className="mt-2 max-w-2xl text-sm text-muted">
                    {selected.id === "general"
                      ? "The workspace-wide room for announcements, questions, and casual coordination."
                      : selected.kind === "direct"
                        ? "A private one-to-one conversation."
                        : "A shared space for project work, clubs, and small teams."}
                  </p>
                  <div className="mt-4">
                    <ChatPresence
                      slug={workspace}
                      conversationId={selected.id}
                      initial={presence}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedMembers.slice(0, 4).map((member) => (
                    <Avatar
                      key={member.id}
                      name={member.name}
                      email={member.email}
                      src={member.image}
                    />
                  ))}
                  {selectedMembers.length > 4 ? (
                    <span className="grid size-9 place-items-center rounded-full bg-cream text-xs font-bold text-muted">
                      +{selectedMembers.length - 4}
                    </span>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-[var(--workspace-card-padding)]">
              <div className="max-h-[62vh] space-y-4 overflow-y-auto pr-1">
                {messages.length === 0 ? (
                  <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-background/40 p-8 text-center">
                    <p className="font-semibold text-ink">No messages yet</p>
                    <p className="mt-1 text-sm text-muted">
                      Start the conversation with a question, update, or file.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      workspace={workspace}
                      conversationId={selected.id}
                      message={message}
                      own={message.senderId === ctx.user.id}
                    />
                  ))
                )}
              </div>

              <ChatComposer
                slug={workspace}
                conversationId={selected.id}
                disabled={false}
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

function conversationTitle(
  conversation: ChatConversation,
  memberMap: Map<
    string,
    { id: string; name: string; email: string; image: string | null; role: MembershipRole }
  >,
) {
  if (conversation.id === "general") return "General";
  if (conversation.kind === "direct") {
    const names = conversation.memberIds
      .map((id) => memberMap.get(id))
      .filter(Boolean)
      .map((member) => member?.name || member?.email || "Member");
    return names.join(" and ") || conversation.title || "Direct chat";
  }
  return conversation.title || "Group chat";
}

function MessageBubble({
  workspace,
  conversationId,
  message,
  own,
}: {
  workspace: string;
  conversationId: string;
  message: ChatMessage;
  own: boolean;
}) {
  return (
    <div className={cn("flex", own ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[82%] rounded-[28px] border px-4 py-3 shadow-sm",
          own ? "border-primary/20 bg-primary/10" : "border-line bg-surface",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-ink">{message.senderName}</p>
            <p className="text-xs text-muted">
              {message.createdAt ? formatDateTime(message.createdAt) : "Just now"}
            </p>
          </div>
          <span className="rounded-pill bg-white/5 px-2.5 py-1 text-xs font-semibold text-muted">
            Reactions
          </span>
        </div>

        {message.body ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {message.body}
          </p>
        ) : null}

        {message.attachments.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {message.attachments.map((attachment) => (
              <AttachmentCard key={attachment.path} attachment={attachment} />
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {REACTIONS.map((emoji) => {
            const reaction = message.reactions.find((r) => r.emoji === emoji);
            return (
              <form
                key={emoji}
                action={reactToMessageAction.bind(
                  null,
                  workspace,
                  conversationId,
                  message.id,
                  emoji,
                )}
              >
                <button
                  type="submit"
                  className={cn(
                    "rounded-pill border px-2.5 py-1 text-xs font-semibold transition-colors",
                    reaction?.active
                      ? "border-primary bg-primary/15 text-ink"
                      : "border-line bg-background/60 text-muted hover:border-primary/40 hover:text-ink",
                  )}
                >
                  {emoji} {reaction?.count ?? 0}
                </button>
              </form>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AttachmentCard({
  attachment,
}: {
  attachment: { name: string; contentType: string; url: string; size: number; path: string };
}) {
  const isImage = attachment.contentType.startsWith("image/");
  return (
    <a
      href={attachment.url || attachment.path}
      target="_blank"
      rel="noreferrer"
      className="overflow-hidden rounded-2xl border border-line bg-background/60 transition-colors hover:border-primary/40"
    >
      {isImage && attachment.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={attachment.url} alt={attachment.name} className="h-40 w-full object-cover" />
      ) : (
        <div className="p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
              <MoreHorizontal className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{attachment.name}</p>
              <p className="text-xs text-muted">
                {(attachment.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        </div>
      )}
    </a>
  );
}

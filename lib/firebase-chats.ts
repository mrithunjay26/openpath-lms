import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { firestoreForTenant } from "@/lib/firebase-admin";
import { getDownloadUrl, uploadFile } from "@/lib/firebase-files";

export type ChatKind = "general" | "direct" | "group";

export type ChatAttachment = {
  name: string;
  path: string;
  size: number;
  contentType: string;
  url: string;
};

export type ChatReaction = {
  emoji: string;
  count: number;
  active: boolean;
};

export type ChatConversation = {
  id: string;
  kind: ChatKind;
  title: string;
  memberIds: string[];
  createdById: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string;
  createdAt: string | null;
  updatedAt: string | null;
  unread?: number;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string | null;
  attachments: ChatAttachment[];
  reactions: ChatReaction[];
};

const GENERAL_ID = "general";

function toISO(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return null;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String).filter(Boolean) : [];
}

function convRef(db: FirebaseFirestore.Firestore, conversationId: string) {
  return db.collection("workspaceChats").doc(conversationId);
}

function generalConversation(): ChatConversation {
  return {
    id: GENERAL_ID,
    kind: "general",
    title: "General",
    memberIds: [],
    createdById: null,
    lastMessageAt: null,
    lastMessagePreview: "Workspace-wide conversation",
    createdAt: null,
    updatedAt: null,
  };
}

function parseReactionMap(raw: unknown, currentUserId: string): ChatReaction[] {
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  return Object.entries(obj)
    .map(([emoji, users]) => {
      const ids = Array.isArray(users) ? users.map(String) : [];
      return {
        emoji,
        count: ids.length,
        active: ids.includes(currentUserId),
      };
    })
    .sort((a, b) => b.count - a.count);
}

function mapConversation(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
): ChatConversation {
  const d = doc.data() ?? {};
  const kind = str((d.kind as string) ?? "general");
  return {
    id: doc.id,
    kind: kind === "direct" || kind === "group" ? kind : "general",
    title: str(d.title) || "General",
    memberIds: arr(d.memberIds),
    createdById: str(d.createdById) || null,
    lastMessageAt: toISO(d.lastMessageAt),
    lastMessagePreview: str(d.lastMessagePreview),
    createdAt: toISO(d.createdAt),
    updatedAt: toISO(d.updatedAt),
  };
}

export async function listWorkspaceChats(
  tenantId: string,
  userId: string,
): Promise<ChatConversation[]> {
  const db = await firestoreForTenant(tenantId);
  const general = await convRef(db, GENERAL_ID).get();
  const custom = await db
    .collection("workspaceChats")
    .where("memberIds", "array-contains", userId)
    .get();

  const conversations = [
    general.exists ? mapConversation(general) : generalConversation(),
    ...custom.docs.map(mapConversation),
  ];

  return conversations.sort((a, b) => {
    if (a.id === GENERAL_ID) return -1;
    if (b.id === GENERAL_ID) return 1;
    const at = a.updatedAt ? Date.parse(a.updatedAt) : 0;
    const bt = b.updatedAt ? Date.parse(b.updatedAt) : 0;
    return bt - at;
  });
}

export async function getChatConversation(
  tenantId: string,
  conversationId: string,
): Promise<ChatConversation | null> {
  if (conversationId === GENERAL_ID) {
    return generalConversation();
  }

  const db = await firestoreForTenant(tenantId);
  const doc = await convRef(db, conversationId).get();
  if (!doc.exists) return null;
  return mapConversation(doc);
}

export async function listChatMessages(
  tenantId: string,
  conversationId: string,
  currentUserId: string,
): Promise<ChatMessage[]> {
  const db = await firestoreForTenant(tenantId);
  const snap = await convRef(db, conversationId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .limit(60)
    .get();

  return Promise.all(
    snap.docs.map(async (doc) => {
      const d = doc.data() ?? {};
      const rawAttachments = Array.isArray(d.attachments) ? d.attachments : [];
      const attachments = await Promise.all(
        rawAttachments.map(async (raw) => {
          const attachment = (raw ?? {}) as Record<string, unknown>;
          const path = str(attachment.path);
          const url = path ? await getDownloadUrl(tenantId, path).catch(() => "") : "";
          return {
            name: str(attachment.name) || path.split("/").pop() || "Attachment",
            path,
            size: typeof attachment.size === "number" ? attachment.size : 0,
            contentType: str(attachment.contentType),
            url,
          };
        }),
      );
      return {
        id: doc.id,
        senderId: str(d.senderId),
        senderName: str(d.senderName),
        body: str(d.body),
        createdAt: toISO(d.createdAt),
        attachments,
        reactions: parseReactionMap(d.reactions, currentUserId),
      };
    }),
  );
}

export async function postChatMessage(
  tenantId: string,
  conversationId: string,
  data: {
    senderId: string;
    senderName: string;
    body: string;
    files?: File[];
  },
): Promise<void> {
  const db = await firestoreForTenant(tenantId);
  const conversationRef = convRef(db, conversationId);
  const messageRef = conversationRef.collection("messages").doc();

  const attachments = [];
  for (let i = 0; i < (data.files?.length ?? 0); i += 1) {
    const file = data.files?.[i];
    if (!file || file.size === 0) continue;
    const path = `chats/${conversationId}/${messageRef.id}/${i}-${file.name}`;
    await uploadFile(tenantId, path, file);
    attachments.push({
      name: file.name,
      path,
      size: file.size,
      contentType: file.type || "application/octet-stream",
    });
  }

  const preview =
    data.body.trim() ||
    (attachments.length > 0 ? `Attachment: ${attachments[0]?.name ?? "file"}` : "");
  if (!preview && attachments.length === 0) return;

  await messageRef.set({
    senderId: data.senderId,
    senderName: data.senderName,
    body: data.body.trim(),
    attachments,
    reactions: {},
    createdAt: FieldValue.serverTimestamp(),
  });

  await conversationRef.set(
    {
      kind: conversationId === GENERAL_ID ? "general" : "group",
      lastMessageAt: FieldValue.serverTimestamp(),
      lastMessagePreview: preview.slice(0, 120),
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function createDirectConversation(
  tenantId: string,
  data: {
    memberIds: [string, string];
    title: string;
    createdById: string;
  },
): Promise<string> {
  const db = await firestoreForTenant(tenantId);
  const memberIds = [...new Set(data.memberIds)].sort();
  const id = ["direct", ...memberIds].join("__");
  await convRef(db, id).set(
    {
      kind: "direct",
      title: data.title,
      memberIds,
      createdById: data.createdById,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastMessagePreview: "Direct chat started",
      lastMessageAt: null,
    },
    { merge: true },
  );
  return id;
}

export async function createGroupConversation(
  tenantId: string,
  data: {
    title: string;
    memberIds: string[];
    createdById: string;
  },
): Promise<string> {
  const db = await firestoreForTenant(tenantId);
  const id = db.collection("workspaceChats").doc().id;
  await convRef(db, id).set({
    kind: "group",
    title: data.title,
    memberIds: [...new Set(data.memberIds)],
    createdById: data.createdById,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    lastMessagePreview: "Group chat started",
    lastMessageAt: null,
  });
  return id;
}

export async function toggleReaction(
  tenantId: string,
  conversationId: string,
  messageId: string,
  emoji: string,
  userId: string,
): Promise<void> {
  const db = await firestoreForTenant(tenantId);
  const ref = convRef(db, conversationId).collection("messages").doc(messageId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const d = snap.data() ?? {};
    const reactions = (d.reactions ?? {}) as Record<string, unknown>;
    const users = Array.isArray(reactions[emoji]) ? [...reactions[emoji] as string[]] : [];
    const next = new Set(users.map(String));
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    reactions[emoji] = [...next];
    tx.set(ref, { reactions }, { merge: true });
  });
}

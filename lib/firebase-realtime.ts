import "server-only";
import { databaseForTenant } from "@/lib/firebase-admin";

export type ChatPresenceState = "online" | "typing";

export type ChatPresenceRecord = {
  userId: string;
  name: string;
  email: string;
  state: ChatPresenceState;
  conversationId: string;
  lastSeenAt: number;
  expiresAt: number;
};

const PRESENCE_TTL_MS = 45_000;
const TYPING_TTL_MS = 8_000;

function presenceRef(
  db: Awaited<ReturnType<typeof databaseForTenant>>,
  tenantId: string,
  conversationId: string,
) {
  return db.ref(`tenantPresence/${tenantId}/conversations/${conversationId}`);
}

function serializePresence(record: ChatPresenceRecord): ChatPresenceRecord {
  return record;
}

function isFresh(record: ChatPresenceRecord, now = Date.now()) {
  return record.expiresAt > now;
}

export async function touchConversationPresence(
  tenantId: string,
  conversationId: string,
  user: { id: string; name?: string | null; email?: string | null },
  state: ChatPresenceState = "online",
): Promise<void> {
  const db = await databaseForTenant(tenantId);
  const now = Date.now();
  const record: ChatPresenceRecord = {
    userId: user.id,
    name: user.name ?? user.email ?? "Member",
    email: user.email ?? "",
    state,
    conversationId,
    lastSeenAt: now,
    expiresAt: now + (state === "typing" ? TYPING_TTL_MS : PRESENCE_TTL_MS),
  };

  await presenceRef(db, tenantId, conversationId).child(user.id).set(record);
}

export async function clearConversationPresence(
  tenantId: string,
  conversationId: string,
  userId: string,
): Promise<void> {
  const db = await databaseForTenant(tenantId);
  await presenceRef(db, tenantId, conversationId).child(userId).remove();
}

export async function getConversationPresence(
  tenantId: string,
  conversationId: string,
): Promise<{
  online: ChatPresenceRecord[];
  typing: ChatPresenceRecord[];
  updatedAt: number;
}> {
  const db = await databaseForTenant(tenantId);
  const snap = await presenceRef(db, tenantId, conversationId).get();
  const raw = (snap.val() ?? {}) as Record<string, unknown>;
  const now = Date.now();
  const records = Object.values(raw)
    .map((value) => value as ChatPresenceRecord)
    .filter((record) => record && typeof record === "object" && isFresh(record, now))
    .map(serializePresence)
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt);

  return {
    online: records.filter((record) => record.state === "online"),
    typing: records.filter((record) => record.state === "typing"),
    updatedAt: now,
  };
}

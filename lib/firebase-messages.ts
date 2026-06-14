import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { firestoreForTenant } from "@/lib/firebase-admin";

export type MessageAudience = "all" | "students" | "staff";

export type WorkspaceMessage = {
  id: string;
  title: string;
  body: string;
  audience: MessageAudience;
  authorId: string;
  authorName: string;
  hidden: boolean;
  createdAt: string | null;
};

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

function audience(v: unknown): MessageAudience {
  return v === "students" || v === "staff" ? v : "all";
}

export async function listWorkspaceMessages(
  tenantId: string,
  viewer: "student" | "staff",
): Promise<WorkspaceMessage[]> {
  const db = await firestoreForTenant(tenantId);
  const snap = await db
    .collection("workspaceMessages")
    .orderBy("createdAt", "desc")
    .limit(80)
    .get();
  return snap.docs
    .map((doc) => {
      const d = doc.data() ?? {};
      return {
        id: doc.id,
        title: str(d.title),
        body: str(d.body),
        audience: audience(d.audience),
        authorId: str(d.authorId),
        authorName: str(d.authorName),
        hidden: Boolean(d.hidden),
        createdAt: toISO(d.createdAt),
      };
    })
    .filter((m) => {
      if (m.hidden) return viewer === "staff";
      if (m.audience === "all") return true;
      return viewer === "student" ? m.audience === "students" : m.audience === "staff";
    });
}

export async function createWorkspaceMessage(
  tenantId: string,
  data: {
    title: string;
    body: string;
    audience: MessageAudience;
    authorId: string;
    authorName: string;
  },
) {
  const db = await firestoreForTenant(tenantId);
  await db.collection("workspaceMessages").add({
    ...data,
    hidden: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function setMessageHidden(
  tenantId: string,
  messageId: string,
  hidden: boolean,
) {
  const db = await firestoreForTenant(tenantId);
  await db.collection("workspaceMessages").doc(messageId).set(
    {
      hidden,
      moderatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

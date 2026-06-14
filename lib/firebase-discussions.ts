import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { firestoreForTenant } from "@/lib/firebase-admin";

/** Threaded course discussions: courses/{id}/discussions/{did}/posts/{pid} */

export type Discussion = {
  id: string;
  title: string;
  authorName: string;
  replyCount: number;
  createdAt: string | null;
};

export type Post = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string | null;
};

function toISO(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return null;
}
const s = (v: unknown) => (typeof v === "string" ? v : "");

function col(db: FirebaseFirestore.Firestore, courseId: string) {
  return db.collection("courses").doc(courseId).collection("discussions");
}

export async function listDiscussions(
  tenantId: string,
  courseId: string,
): Promise<Discussion[]> {
  const db = await firestoreForTenant(tenantId);
  const snap = await col(db, courseId).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => {
    const x = d.data() ?? {};
    return {
      id: d.id,
      title: s(x.title),
      authorName: s(x.authorName),
      replyCount: typeof x.replyCount === "number" ? x.replyCount : 0,
      createdAt: toISO(x.createdAt),
    };
  });
}

export async function getDiscussion(
  tenantId: string,
  courseId: string,
  discussionId: string,
): Promise<Discussion | null> {
  const db = await firestoreForTenant(tenantId);
  const doc = await col(db, courseId).doc(discussionId).get();
  if (!doc.exists) return null;
  const x = doc.data() ?? {};
  return {
    id: doc.id,
    title: s(x.title),
    authorName: s(x.authorName),
    replyCount: typeof x.replyCount === "number" ? x.replyCount : 0,
    createdAt: toISO(x.createdAt),
  };
}

export async function createDiscussion(
  tenantId: string,
  courseId: string,
  data: { title: string; authorName: string },
): Promise<string> {
  const db = await firestoreForTenant(tenantId);
  const ref = await col(db, courseId).add({
    title: data.title,
    authorName: data.authorName,
    replyCount: 0,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function listPosts(
  tenantId: string,
  courseId: string,
  discussionId: string,
): Promise<Post[]> {
  const db = await firestoreForTenant(tenantId);
  const snap = await col(db, courseId)
    .doc(discussionId)
    .collection("posts")
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((d) => {
    const x = d.data() ?? {};
    return {
      id: d.id,
      authorId: s(x.authorId),
      authorName: s(x.authorName),
      body: s(x.body),
      createdAt: toISO(x.createdAt),
    };
  });
}

export async function addPost(
  tenantId: string,
  courseId: string,
  discussionId: string,
  data: { authorId: string; authorName: string; body: string },
): Promise<void> {
  const db = await firestoreForTenant(tenantId);
  const threadRef = col(db, courseId).doc(discussionId);
  await threadRef.collection("posts").add({
    authorId: data.authorId,
    authorName: data.authorName,
    body: data.body,
    createdAt: FieldValue.serverTimestamp(),
  });
  await threadRef.set({ replyCount: FieldValue.increment(1) }, { merge: true });
}

export async function deletePost(
  tenantId: string,
  courseId: string,
  discussionId: string,
  postId: string,
): Promise<void> {
  const db = await firestoreForTenant(tenantId);
  const threadRef = col(db, courseId).doc(discussionId);
  await threadRef.collection("posts").doc(postId).delete();
  await threadRef.set({ replyCount: FieldValue.increment(-1) }, { merge: true });
}

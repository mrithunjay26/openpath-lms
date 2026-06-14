import "server-only";
import { unstable_cache } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { firestoreForTenant } from "@/lib/firebase-admin";

/** Cache tag for a tenant's course list (invalidated when courses change). */
export const coursesTag = (tenantId: string) => `courses:${tenantId}`;

/**
 * Tenant data-plane access (each tenant's own Firestore). Document shape is
 * defined by OpenPath and created inside the tenant's project:
 *
 *   courses/{courseId}
 *     assignments/{assignmentId}
 *       submissions/{userId}
 *     announcements/{id}
 *     enrollments/{userId}
 */

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

function num(v: unknown): number | null {
  return typeof v === "number" ? v : null;
}

export type Course = {
  id: string;
  name: string;
  description: string;
  term: string;
  meetingLink: string;
  skills: string[];
  createdAt: string | null;
};

export type Assignment = {
  id: string;
  title: string;
  details: string;
  points: number | null;
  dueAt: string | null;
  createdAt: string | null;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string | null;
};

export type Submission = {
  userId: string;
  studentName: string;
  studentEmail: string;
  fileName: string;
  filePath: string;
  submittedAt: string | null;
  grade: number | null;
  feedback: string;
  feedbackStrengths: string;
  feedbackNeeds: string;
  feedbackNext: string;
  skillTags: string[];
  gradedAt: string | null;
};

export type Enrollment = {
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string | null;
};

/* ----------------------------- courses ----------------------------- */

async function _listCourses(tenantId: string): Promise<Course[]> {
  const db = await firestoreForTenant(tenantId);
  const snap = await db.collection("courses").orderBy("createdAt", "desc").get();
  return snap.docs.map(mapCourse);
}

// Cached per tenant so repeat navigations don't re-hit Firestore; invalidated
// via revalidateTag(coursesTag(tenantId)) when courses change.
export function listCourses(tenantId: string): Promise<Course[]> {
  return unstable_cache(_listCourses, ["courses-list", tenantId], {
    tags: [coursesTag(tenantId)],
    revalidate: 120,
  })(tenantId);
}

export async function getCourse(
  tenantId: string,
  courseId: string,
): Promise<Course | null> {
  const db = await firestoreForTenant(tenantId);
  const doc = await db.collection("courses").doc(courseId).get();
  if (!doc.exists) return null;
  return mapCourse(doc);
}

export async function createCourse(
  tenantId: string,
  data: {
    name: string;
    description?: string;
    term?: string;
    meetingLink?: string;
    skills?: string[];
  },
): Promise<string> {
  const db = await firestoreForTenant(tenantId);
  const ref = await db.collection("courses").add({
    name: data.name,
    description: data.description ?? "",
    term: data.term ?? "",
    meetingLink: data.meetingLink ?? "",
    skills: data.skills ?? [],
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

function mapCourse(doc: FirebaseFirestore.DocumentSnapshot): Course {
  const d = doc.data() ?? {};
  return {
    id: doc.id,
    name: str(d.name),
    description: str(d.description),
    term: str(d.term),
    meetingLink: str(d.meetingLink),
    skills: Array.isArray(d.skills)
      ? d.skills.map(String)
      : typeof d.skills === "string"
        ? d.skills.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [],
    createdAt: toISO(d.createdAt),
  };
}

/* --------------------------- assignments --------------------------- */

export async function listAssignments(
  tenantId: string,
  courseId: string,
): Promise<Assignment[]> {
  const db = await firestoreForTenant(tenantId);
  const snap = await db
    .collection("courses")
    .doc(courseId)
    .collection("assignments")
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map(mapAssignment);
}

export async function getAssignment(
  tenantId: string,
  courseId: string,
  assignmentId: string,
): Promise<Assignment | null> {
  const db = await firestoreForTenant(tenantId);
  const doc = await db
    .collection("courses")
    .doc(courseId)
    .collection("assignments")
    .doc(assignmentId)
    .get();
  if (!doc.exists) return null;
  return mapAssignment(doc);
}

export async function createAssignment(
  tenantId: string,
  courseId: string,
  data: { title: string; details?: string; points?: number | null; dueAt?: string | null },
): Promise<string> {
  const db = await firestoreForTenant(tenantId);
  const ref = await db
    .collection("courses")
    .doc(courseId)
    .collection("assignments")
    .add({
      title: data.title,
      details: data.details ?? "",
      points: data.points ?? null,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      createdAt: FieldValue.serverTimestamp(),
    });
  return ref.id;
}

function mapAssignment(doc: FirebaseFirestore.DocumentSnapshot): Assignment {
  const d = doc.data() ?? {};
  return {
    id: doc.id,
    title: str(d.title),
    details: str(d.details),
    points: num(d.points),
    dueAt: toISO(d.dueAt),
    createdAt: toISO(d.createdAt),
  };
}

/* --------------------------- submissions --------------------------- */

export async function listSubmissions(
  tenantId: string,
  courseId: string,
  assignmentId: string,
): Promise<Submission[]> {
  const db = await firestoreForTenant(tenantId);
  const snap = await db
    .collection("courses")
    .doc(courseId)
    .collection("assignments")
    .doc(assignmentId)
    .collection("submissions")
    .get();
  return snap.docs.map(mapSubmission);
}

export async function getSubmission(
  tenantId: string,
  courseId: string,
  assignmentId: string,
  userId: string,
): Promise<Submission | null> {
  const db = await firestoreForTenant(tenantId);
  const doc = await db
    .collection("courses")
    .doc(courseId)
    .collection("assignments")
    .doc(assignmentId)
    .collection("submissions")
    .doc(userId)
    .get();
  if (!doc.exists) return null;
  return mapSubmission(doc);
}

export async function setSubmissionFile(
  tenantId: string,
  courseId: string,
  assignmentId: string,
  userId: string,
  data: {
    studentName: string;
    studentEmail: string;
    fileName: string;
    filePath: string;
  },
) {
  const db = await firestoreForTenant(tenantId);
  await db
    .collection("courses")
    .doc(courseId)
    .collection("assignments")
    .doc(assignmentId)
    .collection("submissions")
    .doc(userId)
    .set(
      {
        userId,
        studentName: data.studentName,
        studentEmail: data.studentEmail,
        fileName: data.fileName,
        filePath: data.filePath,
        submittedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

export async function gradeSubmission(
  tenantId: string,
  courseId: string,
  assignmentId: string,
  userId: string,
  data: {
    grade: number | null;
    feedback: string;
    feedbackStrengths?: string;
    feedbackNeeds?: string;
    feedbackNext?: string;
    skillTags?: string[];
  },
) {
  const db = await firestoreForTenant(tenantId);
  await db
    .collection("courses")
    .doc(courseId)
    .collection("assignments")
    .doc(assignmentId)
    .collection("submissions")
    .doc(userId)
    .set(
      {
        grade: data.grade,
        feedback: data.feedback,
        feedbackStrengths: data.feedbackStrengths ?? "",
        feedbackNeeds: data.feedbackNeeds ?? "",
        feedbackNext: data.feedbackNext ?? "",
        skillTags: data.skillTags ?? [],
        gradedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

function mapSubmission(doc: FirebaseFirestore.DocumentSnapshot): Submission {
  const d = doc.data() ?? {};
  return {
    userId: doc.id,
    studentName: str(d.studentName),
    studentEmail: str(d.studentEmail),
    fileName: str(d.fileName),
    filePath: str(d.filePath),
    submittedAt: toISO(d.submittedAt),
    grade: num(d.grade),
    feedback: str(d.feedback),
    feedbackStrengths: str(d.feedbackStrengths),
    feedbackNeeds: str(d.feedbackNeeds),
    feedbackNext: str(d.feedbackNext),
    skillTags: Array.isArray(d.skillTags)
      ? d.skillTags.map(String)
      : typeof d.skillTags === "string"
        ? d.skillTags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [],
    gradedAt: toISO(d.gradedAt),
  };
}

/* --------------------------- announcements --------------------------- */

export async function listAnnouncements(
  tenantId: string,
  courseId: string,
): Promise<Announcement[]> {
  const db = await firestoreForTenant(tenantId);
  const snap = await db
    .collection("courses")
    .doc(courseId)
    .collection("announcements")
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((doc) => {
    const d = doc.data() ?? {};
    return {
      id: doc.id,
      title: str(d.title),
      body: str(d.body),
      authorName: str(d.authorName),
      createdAt: toISO(d.createdAt),
    };
  });
}

export async function createAnnouncement(
  tenantId: string,
  courseId: string,
  data: { title: string; body: string; authorName: string },
): Promise<string> {
  const db = await firestoreForTenant(tenantId);
  const ref = await db
    .collection("courses")
    .doc(courseId)
    .collection("announcements")
    .add({
      title: data.title,
      body: data.body,
      authorName: data.authorName,
      createdAt: FieldValue.serverTimestamp(),
    });
  return ref.id;
}

/* --------------------------- enrollments --------------------------- */

export async function listEnrollments(
  tenantId: string,
  courseId: string,
): Promise<Enrollment[]> {
  const db = await firestoreForTenant(tenantId);
  const snap = await db
    .collection("courses")
    .doc(courseId)
    .collection("enrollments")
    .get();
  return snap.docs.map((doc) => {
    const d = doc.data() ?? {};
    return {
      userId: doc.id,
      name: str(d.name),
      email: str(d.email),
      role: str(d.role) || "STUDENT",
      joinedAt: toISO(d.joinedAt),
    };
  });
}

export async function enrollUser(
  tenantId: string,
  courseId: string,
  user: { userId: string; name: string; email: string; role?: string },
) {
  const db = await firestoreForTenant(tenantId);
  await db
    .collection("courses")
    .doc(courseId)
    .collection("enrollments")
    .doc(user.userId)
    .set(
      {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role ?? "STUDENT",
        joinedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

export async function listCoursesForStudent(
  tenantId: string,
  userId: string,
): Promise<Course[]> {
  const db = await firestoreForTenant(tenantId);
  // Enrollment is stored per-course; collectionGroup finds the student's docs.
  const snap = await db
    .collectionGroup("enrollments")
    .where("userId", "==", userId)
    .get();
  const courseIds = snap.docs
    .map((d) => d.ref.parent.parent?.id)
    .filter((v): v is string => Boolean(v));
  const courses = await Promise.all(
    courseIds.map((id) => getCourse(tenantId, id)),
  );
  return courses.filter((c): c is Course => Boolean(c));
}

/* ----------------------------- modules ----------------------------- */

export type ModuleItemType = "lesson" | "link" | "file";

export type ModuleItem = {
  id: string;
  type: ModuleItemType;
  title: string;
  content: string;
  url: string;
  order: number;
};

export type CourseModule = {
  id: string;
  title: string;
  order: number;
  items: ModuleItem[];
};

const ITEM_TYPES: ModuleItemType[] = ["lesson", "link", "file"];

export async function listModules(
  tenantId: string,
  courseId: string,
): Promise<CourseModule[]> {
  const db = await firestoreForTenant(tenantId);
  const modsSnap = await db
    .collection("courses")
    .doc(courseId)
    .collection("modules")
    .orderBy("order", "asc")
    .get();
  return Promise.all(
    modsSnap.docs.map(async (m) => {
      const itemsSnap = await m.ref.collection("items").orderBy("order", "asc").get();
      const items: ModuleItem[] = itemsSnap.docs.map((d) => {
        const x = d.data() ?? {};
        const t = x.type as ModuleItemType;
        return {
          id: d.id,
          type: ITEM_TYPES.includes(t) ? t : "lesson",
          title: str(x.title),
          content: str(x.content),
          url: str(x.url),
          order: num(x.order) ?? 0,
        };
      });
      const md = m.data() ?? {};
      return { id: m.id, title: str(md.title), order: num(md.order) ?? 0, items };
    }),
  );
}

export async function createModule(
  tenantId: string,
  courseId: string,
  title: string,
): Promise<string> {
  const db = await firestoreForTenant(tenantId);
  const col = db.collection("courses").doc(courseId).collection("modules");
  const count = (await col.count().get()).data().count;
  const ref = await col.add({
    title,
    order: count,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function addModuleItem(
  tenantId: string,
  courseId: string,
  moduleId: string,
  data: { type: ModuleItemType; title: string; content?: string; url?: string },
): Promise<string> {
  const db = await firestoreForTenant(tenantId);
  const col = db
    .collection("courses")
    .doc(courseId)
    .collection("modules")
    .doc(moduleId)
    .collection("items");
  const count = (await col.count().get()).data().count;
  const ref = await col.add({
    type: data.type,
    title: data.title,
    content: data.content ?? "",
    url: data.url ?? "",
    order: count,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

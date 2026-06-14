import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { firestoreForTenant } from "@/lib/firebase-admin";

/**
 * Quizzes / assessments live in the tenant's Firestore:
 *   courses/{courseId}/assessments/{assessmentId}
 *     attempts/{userId}
 * Objective questions auto-grade; short-answer is flagged for manual grading.
 */

export type QuestionType = "mcq" | "multi" | "truefalse" | "short";

export type Question = {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  correct: number[];
  points: number;
};

export type Assessment = {
  id: string;
  title: string;
  description: string;
  dueAt: string | null;
  timeLimit: number | null;
  totalPoints: number;
  questions: Question[];
  createdAt: string | null;
};

export type Attempt = {
  userId: string;
  studentName: string;
  studentEmail: string;
  answers: Record<string, number[] | string>;
  autoScore: number;
  manualScore: number | null;
  score: number | null;
  needsManual: boolean;
  submittedAt: string | null;
};

function toISO(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return null;
}

function assessmentsCol(db: FirebaseFirestore.Firestore, courseId: string) {
  return db.collection("courses").doc(courseId).collection("assessments");
}

export function totalPoints(questions: Question[]): number {
  return questions.reduce((sum, q) => sum + (q.points || 0), 0);
}

export async function listAssessments(
  tenantId: string,
  courseId: string,
): Promise<Assessment[]> {
  const db = await firestoreForTenant(tenantId);
  const snap = await assessmentsCol(db, courseId)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map(mapAssessment);
}

export async function getAssessment(
  tenantId: string,
  courseId: string,
  assessmentId: string,
): Promise<Assessment | null> {
  const db = await firestoreForTenant(tenantId);
  const doc = await assessmentsCol(db, courseId).doc(assessmentId).get();
  if (!doc.exists) return null;
  return mapAssessment(doc);
}

export async function createAssessment(
  tenantId: string,
  courseId: string,
  data: {
    title: string;
    description?: string;
    dueAt?: string | null;
    timeLimit?: number | null;
    questions: Question[];
  },
): Promise<string> {
  const db = await firestoreForTenant(tenantId);
  const ref = await assessmentsCol(db, courseId).add({
    title: data.title,
    description: data.description ?? "",
    dueAt: data.dueAt ? new Date(data.dueAt) : null,
    timeLimit: data.timeLimit ?? null,
    totalPoints: totalPoints(data.questions),
    questions: data.questions,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

function mapAssessment(doc: FirebaseFirestore.DocumentSnapshot): Assessment {
  const d = doc.data() ?? {};
  const questions = Array.isArray(d.questions)
    ? (d.questions as Question[])
    : [];
  return {
    id: doc.id,
    title: typeof d.title === "string" ? d.title : "",
    description: typeof d.description === "string" ? d.description : "",
    dueAt: toISO(d.dueAt),
    timeLimit: typeof d.timeLimit === "number" ? d.timeLimit : null,
    totalPoints:
      typeof d.totalPoints === "number" ? d.totalPoints : totalPoints(questions),
    questions,
    createdAt: toISO(d.createdAt),
  };
}

/* ----------------------------- attempts ----------------------------- */

function setsEqual(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

/** Auto-grade objective questions; returns score + whether manual grading is needed. */
export function autoGrade(
  questions: Question[],
  answers: Record<string, number[] | string>,
): { autoScore: number; needsManual: boolean } {
  let autoScore = 0;
  let needsManual = false;
  for (const q of questions) {
    if (q.type === "short") {
      if (answers[q.id]) needsManual = true;
      continue;
    }
    const ans = answers[q.id];
    const selected = Array.isArray(ans) ? ans : [];
    if (setsEqual(selected, q.correct)) autoScore += q.points || 0;
  }
  return { autoScore, needsManual };
}

export async function submitAttempt(
  tenantId: string,
  courseId: string,
  assessmentId: string,
  userId: string,
  data: {
    studentName: string;
    studentEmail: string;
    answers: Record<string, number[] | string>;
    questions: Question[];
  },
) {
  const db = await firestoreForTenant(tenantId);
  const { autoScore, needsManual } = autoGrade(data.questions, data.answers);
  await assessmentsCol(db, courseId)
    .doc(assessmentId)
    .collection("attempts")
    .doc(userId)
    .set({
      userId,
      studentName: data.studentName,
      studentEmail: data.studentEmail,
      answers: data.answers,
      autoScore,
      manualScore: null,
      score: needsManual ? null : autoScore,
      needsManual,
      submittedAt: FieldValue.serverTimestamp(),
    });
  return { autoScore, needsManual };
}

export async function getAttempt(
  tenantId: string,
  courseId: string,
  assessmentId: string,
  userId: string,
): Promise<Attempt | null> {
  const db = await firestoreForTenant(tenantId);
  const doc = await assessmentsCol(db, courseId)
    .doc(assessmentId)
    .collection("attempts")
    .doc(userId)
    .get();
  if (!doc.exists) return null;
  return mapAttempt(doc);
}

export async function listAttempts(
  tenantId: string,
  courseId: string,
  assessmentId: string,
): Promise<Attempt[]> {
  const db = await firestoreForTenant(tenantId);
  const snap = await assessmentsCol(db, courseId)
    .doc(assessmentId)
    .collection("attempts")
    .get();
  return snap.docs.map(mapAttempt);
}

export async function gradeAttemptManual(
  tenantId: string,
  courseId: string,
  assessmentId: string,
  userId: string,
  manualScore: number,
) {
  const db = await firestoreForTenant(tenantId);
  const ref = assessmentsCol(db, courseId)
    .doc(assessmentId)
    .collection("attempts")
    .doc(userId);
  const snap = await ref.get();
  const auto = (snap.data()?.autoScore as number) ?? 0;
  await ref.set(
    {
      manualScore,
      score: auto + manualScore,
      needsManual: false,
    },
    { merge: true },
  );
}

function mapAttempt(doc: FirebaseFirestore.DocumentSnapshot): Attempt {
  const d = doc.data() ?? {};
  return {
    userId: doc.id,
    studentName: typeof d.studentName === "string" ? d.studentName : "",
    studentEmail: typeof d.studentEmail === "string" ? d.studentEmail : "",
    answers: (d.answers as Record<string, number[] | string>) ?? {},
    autoScore: typeof d.autoScore === "number" ? d.autoScore : 0,
    manualScore: typeof d.manualScore === "number" ? d.manualScore : null,
    score: typeof d.score === "number" ? d.score : null,
    needsManual: Boolean(d.needsManual),
    submittedAt: toISO(d.submittedAt),
  };
}

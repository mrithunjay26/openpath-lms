import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { firestoreForTenant } from "@/lib/firebase-admin";

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT";

export type AttendanceRecord = {
  id: string;
  courseId: string;
  userId: string;
  name: string;
  email: string;
  status: AttendanceStatus;
  meetingAt: string | null;
  note: string;
  markedAt: string | null;
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

function status(v: unknown): AttendanceStatus {
  return v === "LATE" || v === "ABSENT" ? v : "PRESENT";
}

export async function listAttendance(
  tenantId: string,
  courseId: string,
): Promise<AttendanceRecord[]> {
  const db = await firestoreForTenant(tenantId);
  const snap = await db
    .collection("courses")
    .doc(courseId)
    .collection("attendance")
    .orderBy("markedAt", "desc")
    .limit(80)
    .get();
  return snap.docs.map((doc) => {
    const d = doc.data() ?? {};
    return {
      id: doc.id,
      courseId,
      userId: str(d.userId),
      name: str(d.name),
      email: str(d.email),
      status: status(d.status),
      meetingAt: toISO(d.meetingAt),
      note: str(d.note),
      markedAt: toISO(d.markedAt),
    };
  });
}

export async function markAttendance(
  tenantId: string,
  courseId: string,
  data: {
    userId: string;
    name: string;
    email: string;
    status: AttendanceStatus;
    meetingAt: string;
    note?: string;
  },
) {
  const db = await firestoreForTenant(tenantId);
  const day = data.meetingAt.slice(0, 10) || new Date().toISOString().slice(0, 10);
  await db
    .collection("courses")
    .doc(courseId)
    .collection("attendance")
    .doc(`${day}_${data.userId}`)
    .set(
      {
        ...data,
        meetingAt: data.meetingAt ? new Date(data.meetingAt) : new Date(),
        markedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

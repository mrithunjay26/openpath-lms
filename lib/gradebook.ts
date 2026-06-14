import "server-only";
import {
  listAssignments,
  listEnrollments,
  listSubmissions,
} from "@/lib/firebase-data";
import { listAssessments, listAttempts } from "@/lib/firebase-assessments";

export type GradeColumn = {
  id: string;
  title: string;
  kind: "assignment" | "quiz";
  points: number;
};

export type GradeRow = {
  userId: string;
  name: string;
  email: string;
  cells: Record<string, number | null>;
  earned: number;
  possible: number;
  percent: number | null;
};

export type Gradebook = { columns: GradeColumn[]; rows: GradeRow[] };

/** Aggregate assignment grades + quiz scores into a per-student gradebook. */
export async function computeGradebook(
  tenantId: string,
  courseId: string,
): Promise<Gradebook> {
  const [enrollments, assignments, assessments] = await Promise.all([
    listEnrollments(tenantId, courseId),
    listAssignments(tenantId, courseId),
    listAssessments(tenantId, courseId),
  ]);

  const students = enrollments.filter((e) => e.role !== "TEACHER");
  const gradedAssignments = assignments.filter((a) => a.points != null);

  const columns: GradeColumn[] = [
    ...gradedAssignments.map((a) => ({
      id: `a_${a.id}`,
      title: a.title,
      kind: "assignment" as const,
      points: a.points ?? 0,
    })),
    ...assessments.map((a) => ({
      id: `q_${a.id}`,
      title: a.title,
      kind: "quiz" as const,
      points: a.totalPoints,
    })),
  ];

  const subMaps = await Promise.all(
    gradedAssignments.map(async (a) => {
      const subs = await listSubmissions(tenantId, courseId, a.id);
      const map: Record<string, number | null> = {};
      subs.forEach((s) => (map[s.userId] = s.grade));
      return { id: a.id, map };
    }),
  );
  const attMaps = await Promise.all(
    assessments.map(async (a) => {
      const att = await listAttempts(tenantId, courseId, a.id);
      const map: Record<string, number | null> = {};
      att.forEach((t) => (map[t.userId] = t.score));
      return { id: a.id, map };
    }),
  );
  const subById = Object.fromEntries(subMaps.map((x) => [x.id, x.map]));
  const attById = Object.fromEntries(attMaps.map((x) => [x.id, x.map]));

  const rows: GradeRow[] = students.map((s) => {
    const cells: Record<string, number | null> = {};
    let earned = 0;
    let possible = 0;
    for (const a of gradedAssignments) {
      const g = subById[a.id]?.[s.userId] ?? null;
      cells[`a_${a.id}`] = g;
      possible += a.points ?? 0;
      if (g != null) earned += g;
    }
    for (const a of assessments) {
      const sc = attById[a.id]?.[s.userId] ?? null;
      cells[`q_${a.id}`] = sc;
      possible += a.totalPoints;
      if (sc != null) earned += sc;
    }
    return {
      userId: s.userId,
      name: s.name,
      email: s.email,
      cells,
      earned,
      possible,
      percent: possible > 0 ? Math.round((earned / possible) * 100) : null,
    };
  });

  return { columns, rows };
}

export function gradebookToCsv(gb: Gradebook): string {
  const header = ["Student", "Email", ...gb.columns.map((c) => c.title), "Total", "Percent"];
  const lines = [header.map(csvCell).join(",")];
  for (const r of gb.rows) {
    const row = [
      r.name,
      r.email,
      ...gb.columns.map((c) => {
        const v = r.cells[c.id];
        return v == null ? "" : String(v);
      }),
      `${r.earned}/${r.possible}`,
      r.percent == null ? "" : `${r.percent}%`,
    ];
    lines.push(row.map(csvCell).join(","));
  }
  return lines.join("\n");
}

function csvCell(v: string): string {
  const needsQuote = /[",\n]/.test(v);
  const escaped = v.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

import "server-only";
import { prisma } from "@/lib/prisma";
import {
  listAssignments,
  listCourses,
  listEnrollments,
  listSubmissions,
} from "@/lib/firebase-data";
import { listAssessments, listAttempts } from "@/lib/firebase-assessments";

export type ImpactReport = {
  generatedAt: string;
  tenantName: string;
  memberCount: number;
  studentCount: number;
  courseCount: number;
  assignmentCount: number;
  assessmentCount: number;
  submissionCount: number;
  averageScore: number | null;
  skillEvidence: Array<{ skill: string; count: number }>;
  courseRows: Array<{
    name: string;
    students: number;
    assignments: number;
    assessments: number;
    submissions: number;
  }>;
};

export async function buildImpactReport(tenantId: string): Promise<ImpactReport> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { memberships: true },
  });
  const courses = await listCourses(tenantId).catch(() => []);
  const skillMap = new Map<string, number>();
  let assignmentCount = 0;
  let assessmentCount = 0;
  let submissionCount = 0;
  const scores: number[] = [];
  const courseRows: ImpactReport["courseRows"] = [];

  for (const course of courses) {
    const [enrollments, assignments, assessments] = await Promise.all([
      listEnrollments(tenantId, course.id).catch(() => []),
      listAssignments(tenantId, course.id).catch(() => []),
      listAssessments(tenantId, course.id).catch(() => []),
    ]);
    let courseSubmissions = 0;
    assignmentCount += assignments.length;
    assessmentCount += assessments.length;
    course.skills.forEach((skill) => skillMap.set(skill, skillMap.get(skill) ?? 0));

    for (const assignment of assignments) {
      const subs = await listSubmissions(tenantId, course.id, assignment.id).catch(
        () => [],
      );
      courseSubmissions += subs.filter((s) => s.submittedAt).length;
      for (const sub of subs) {
        const tags = sub.skillTags.length > 0 ? sub.skillTags : course.skills;
        tags.forEach((tag) => skillMap.set(tag, (skillMap.get(tag) ?? 0) + 1));
        if (sub.grade != null && assignment.points) scores.push(sub.grade / assignment.points);
      }
    }

    for (const assessment of assessments) {
      const attempts = await listAttempts(tenantId, course.id, assessment.id).catch(
        () => [],
      );
      courseSubmissions += attempts.filter((a) => a.submittedAt).length;
      attempts.forEach((attempt) => {
        course.skills.forEach((skill) =>
          skillMap.set(skill, (skillMap.get(skill) ?? 0) + 1),
        );
        if (attempt.score != null && assessment.totalPoints) {
          scores.push(attempt.score / assessment.totalPoints);
        }
      });
    }

    submissionCount += courseSubmissions;
    courseRows.push({
      name: course.name,
      students: enrollments.length,
      assignments: assignments.length,
      assessments: assessments.length,
      submissions: courseSubmissions,
    });
  }

  const memberCount = tenant?.memberships.length ?? 0;
  return {
    generatedAt: new Date().toISOString(),
    tenantName: tenant?.name ?? "Workspace",
    memberCount,
    studentCount:
      tenant?.memberships.filter((m) => m.role === "STUDENT").length ?? 0,
    courseCount: courses.length,
    assignmentCount,
    assessmentCount,
    submissionCount,
    averageScore:
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : null,
    skillEvidence: [...skillMap.entries()]
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    courseRows,
  };
}

export function impactReportLines(report: ImpactReport) {
  return [
    `${report.tenantName} impact report`,
    `Generated ${new Date(report.generatedAt).toLocaleString()}`,
    "",
    `Members: ${report.memberCount}`,
    `Students: ${report.studentCount}`,
    `Courses: ${report.courseCount}`,
    `Assignments: ${report.assignmentCount}`,
    `Assessments: ${report.assessmentCount}`,
    `Submissions / attempts: ${report.submissionCount}`,
    `Average score: ${
      report.averageScore == null ? "Not enough graded evidence" : `${Math.round(report.averageScore * 100)}%`
    }`,
    "",
    "Skill evidence",
    ...report.skillEvidence.map((s) => `- ${s.skill}: ${s.count}`),
    "",
    "Course reach",
    ...report.courseRows.map(
      (c) =>
        `- ${c.name}: ${c.students} learners, ${c.assignments} assignments, ${c.assessments} quizzes, ${c.submissions} submissions`,
    ),
  ];
}

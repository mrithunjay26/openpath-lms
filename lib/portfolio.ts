import "server-only";
import {
  getSubmission,
  listAssignments,
  listCoursesForStudent,
  type Course,
} from "@/lib/firebase-data";
import {
  getAttempt,
  listAssessments,
} from "@/lib/firebase-assessments";

export type PortfolioArtifact = {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  type: "assignment" | "quiz";
  score: number | null;
  points: number | null;
  submittedAt: string | null;
  feedback: string;
  skillTags: string[];
};

export type BadgeAward = {
  id: string;
  title: string;
  description: string;
  tone: "primary" | "green" | "purple" | "teal" | "yellow";
};

export type StudentPortfolio = {
  courses: Course[];
  artifacts: PortfolioArtifact[];
  skills: Array<{ skill: string; evidence: number; average: number | null }>;
  badges: BadgeAward[];
};

export async function getStudentPortfolio(
  tenantId: string,
  userId: string,
): Promise<StudentPortfolio> {
  const courses = await listCoursesForStudent(tenantId, userId);
  const artifacts: PortfolioArtifact[] = [];
  const skillScores = new Map<string, number[]>();

  for (const course of courses) {
    for (const skill of course.skills) {
      if (!skillScores.has(skill)) skillScores.set(skill, []);
    }
    const [assignments, assessments] = await Promise.all([
      listAssignments(tenantId, course.id).catch(() => []),
      listAssessments(tenantId, course.id).catch(() => []),
    ]);

    for (const a of assignments) {
      const sub = await getSubmission(tenantId, course.id, a.id, userId).catch(
        () => null,
      );
      if (!sub?.submittedAt) continue;
      const score = sub.grade;
      const pct = score != null && a.points ? score / a.points : null;
      const tags = sub.skillTags.length > 0 ? sub.skillTags : course.skills;
      tags.forEach((tag) => {
        if (!skillScores.has(tag)) skillScores.set(tag, []);
        if (pct != null) skillScores.get(tag)?.push(pct);
      });
      artifacts.push({
        id: a.id,
        courseId: course.id,
        courseName: course.name,
        title: a.title,
        type: "assignment",
        score,
        points: a.points,
        submittedAt: sub.submittedAt,
        feedback: sub.feedbackNext || sub.feedback || "",
        skillTags: tags,
      });
    }

    for (const assessment of assessments) {
      const attempt = await getAttempt(
        tenantId,
        course.id,
        assessment.id,
        userId,
      ).catch(() => null);
      if (!attempt?.submittedAt) continue;
      const pct =
        attempt.score != null && assessment.totalPoints
          ? attempt.score / assessment.totalPoints
          : null;
      course.skills.forEach((skill) => {
        if (!skillScores.has(skill)) skillScores.set(skill, []);
        if (pct != null) skillScores.get(skill)?.push(pct);
      });
      artifacts.push({
        id: assessment.id,
        courseId: course.id,
        courseName: course.name,
        title: assessment.title,
        type: "quiz",
        score: attempt.score,
        points: assessment.totalPoints,
        submittedAt: attempt.submittedAt,
        feedback: attempt.needsManual ? "Includes manually reviewed responses." : "",
        skillTags: course.skills,
      });
    }
  }

  const skills = [...skillScores.entries()].map(([skill, scores]) => ({
    skill,
    evidence: scores.length,
    average:
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : null,
  }));

  const badges: BadgeAward[] = [];
  if (artifacts.length > 0) {
    badges.push({
      id: "first-artifact",
      title: "Portfolio starter",
      description: "Submitted the first portfolio artifact.",
      tone: "primary",
    });
  }
  if (artifacts.length >= 5) {
    badges.push({
      id: "steady-builder",
      title: "Steady builder",
      description: "Built a portfolio with five or more artifacts.",
      tone: "green",
    });
  }
  if (skills.some((s) => s.evidence >= 3)) {
    badges.push({
      id: "skill-evidence",
      title: "Skill evidence",
      description: "Collected repeated evidence for a skill.",
      tone: "purple",
    });
  }
  if (skills.some((s) => (s.average ?? 0) >= 0.9)) {
    badges.push({
      id: "high-mastery",
      title: "High mastery",
      description: "Reached 90% average evidence in at least one skill.",
      tone: "teal",
    });
  }

  return { courses, artifacts, skills, badges };
}

export function buildMasterySteps(portfolio: StudentPortfolio) {
  const weak = portfolio.skills
    .filter((s) => s.average == null || s.average < 0.75)
    .sort((a, b) => (a.average ?? 0) - (b.average ?? 0));
  const focus = weak.slice(0, 3);
  if (focus.length === 0 && portfolio.skills.length > 0) {
    return [
      {
        title: "Stretch your strongest skill",
        body: "Choose one strong artifact and revise it for a real audience.",
      },
      {
        title: "Find a matching opportunity",
        body: "Use the opportunities tab to apply your strongest skill outside class.",
      },
    ];
  }
  return focus.map((s) => ({
    title: `Build evidence for ${s.skill}`,
    body:
      s.evidence === 0
        ? "Submit an artifact tagged with this skill so your portfolio has a baseline."
        : "Ask for feedback, revise one artifact, and add a reflection on what improved.",
  }));
}

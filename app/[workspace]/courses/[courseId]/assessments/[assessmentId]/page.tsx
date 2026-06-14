import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { isStaff, requireMembership } from "@/lib/tenant";
import { getCourse } from "@/lib/firebase-data";
import {
  getAssessment,
  getAttempt,
  listAttempts,
} from "@/lib/firebase-assessments";
import { CourseTabs } from "@/components/workspace/course-tabs";
import { NotConnected } from "@/components/workspace/not-connected";
import {
  AssessmentTaker,
  type SafeQuestion,
} from "@/components/workspace/assessment-taker";
import { AssessmentGradeForm } from "@/components/workspace/assessment-grade-form";
import { StudentHintPanel } from "@/components/workspace/student-hint-panel";
import { PageHeader } from "@/components/workspace/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ workspace: string; courseId: string; assessmentId: string }>;
}) {
  const { workspace, courseId, assessmentId } = await params;
  const ctx = await requireMembership(workspace);
  const staff = isStaff(ctx.role);

  if (ctx.tenant.firebase?.status !== "ACTIVE") {
    return (
      <div className="mx-auto max-w-4xl">
        <NotConnected slug={workspace} isOwner={ctx.role === "OWNER"} />
      </div>
    );
  }

  const [course, assessment] = await Promise.all([
    getCourse(ctx.tenant.id, courseId),
    getAssessment(ctx.tenant.id, courseId, assessmentId),
  ]);
  if (!course || !assessment) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/${workspace}/courses/${courseId}/assessments`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Quizzes
      </Link>
      <CourseTabs workspace={workspace} courseId={courseId} staff={staff} />

      <PageHeader
        title={assessment.title}
        description={assessment.description || undefined}
        action={<Badge tone="purple">{assessment.totalPoints} pts</Badge>}
      />

      {staff ? (
        <StaffView
          workspace={workspace}
          courseId={courseId}
          assessmentId={assessmentId}
          tenantId={ctx.tenant.id}
        />
      ) : (
        <StudentView
          workspace={workspace}
          courseId={courseId}
          assessmentId={assessmentId}
          tenantId={ctx.tenant.id}
          userId={ctx.user.id}
          context={[
            `Quiz: ${assessment.title}`,
            assessment.description,
            ...assessment.questions.map((q, i) => `${i + 1}. ${q.prompt}`),
          ].filter(Boolean).join("\n")}
          questions={assessment.questions.map<SafeQuestion>((q) => ({
            id: q.id,
            type: q.type,
            prompt: q.prompt,
            options: q.options,
            points: q.points,
          }))}
        />
      )}
    </div>
  );
}

async function StudentView({
  workspace,
  courseId,
  assessmentId,
  tenantId,
  userId,
  context,
  questions,
}: {
  workspace: string;
  courseId: string;
  assessmentId: string;
  tenantId: string;
  userId: string;
  context: string;
  questions: SafeQuestion[];
}) {
  const attempt = await getAttempt(tenantId, courseId, assessmentId, userId);

  if (attempt?.submittedAt) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
            <CheckCircle2 className="size-4" /> Submitted{" "}
            {formatDateTime(attempt.submittedAt)}
          </div>
          <div className="mt-4">
            {attempt.score != null ? (
              <p className="text-2xl font-extrabold text-ink">
                {attempt.score} points
              </p>
            ) : (
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                <Clock className="size-4" /> Awaiting manual grading
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <AssessmentTaker
        workspace={workspace}
        courseId={courseId}
        assessmentId={assessmentId}
        questions={questions}
      />
      <StudentHintPanel
        workspace={workspace}
        courseId={courseId}
        context={context}
      />
    </div>
  );
}

async function StaffView({
  workspace,
  courseId,
  assessmentId,
  tenantId,
}: {
  workspace: string;
  courseId: string;
  assessmentId: string;
  tenantId: string;
}) {
  const attempts = await listAttempts(tenantId, courseId, assessmentId);

  return (
    <div>
      <h2 className="mb-3 text-lg font-bold text-ink">
        Submissions ({attempts.length})
      </h2>
      {attempts.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No attempts yet"
          description="Student attempts will appear here as they submit."
        />
      ) : (
        <div className="space-y-3">
          {attempts.map((a) => (
            <Card key={a.userId}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Avatar
                    name={a.studentName}
                    email={a.studentEmail}
                    className="size-9"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">
                      {a.studentName || a.studentEmail}
                    </p>
                    <p className="text-xs text-muted">
                      {a.submittedAt
                        ? `Submitted ${formatDateTime(a.submittedAt)}`
                        : "In progress"}
                    </p>
                  </div>
                  {a.score != null ? (
                    <Badge tone="green">{a.score} pts</Badge>
                  ) : (
                    <Badge tone="yellow">Needs grading</Badge>
                  )}
                </div>
                {a.needsManual ? (
                  <div className="mt-4 border-t border-line pt-4">
                    <AssessmentGradeForm
                      workspace={workspace}
                      courseId={courseId}
                      assessmentId={assessmentId}
                      studentId={a.userId}
                      autoScore={a.autoScore}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

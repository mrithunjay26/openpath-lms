import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
} from "lucide-react";
import { isStaff, requireMembership } from "@/lib/tenant";
import {
  getAssignment,
  getCourse,
  getSubmission,
  listSubmissions,
} from "@/lib/firebase-data";
import { PageHeader } from "@/components/workspace/page-header";
import { NotConnected } from "@/components/workspace/not-connected";
import { SubmitAssignmentForm } from "@/components/workspace/submit-assignment-form";
import { GradeForm } from "@/components/workspace/grade-form";
import { StudentHintPanel } from "@/components/workspace/student-hint-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";

export default async function AssignmentPage({
  params,
}: {
  params: Promise<{ workspace: string; courseId: string; assignmentId: string }>;
}) {
  const { workspace, courseId, assignmentId } = await params;
  const ctx = await requireMembership(workspace);
  const staff = isStaff(ctx.role);

  if (ctx.tenant.firebase?.status !== "ACTIVE") {
    return (
      <div className="mx-auto max-w-4xl">
        <NotConnected slug={workspace} isOwner={ctx.role === "OWNER"} />
      </div>
    );
  }

  const [course, assignment] = await Promise.all([
    getCourse(ctx.tenant.id, courseId),
    getAssignment(ctx.tenant.id, courseId, assignmentId),
  ]);
  if (!course || !assignment) notFound();

  const dl = (path: string) =>
    `/api/${workspace}/files/download?path=${encodeURIComponent(path)}`;

  const submissions = staff
    ? await listSubmissions(ctx.tenant.id, courseId, assignmentId)
    : [];
  const mine = !staff
    ? await getSubmission(ctx.tenant.id, courseId, assignmentId, ctx.user.id)
    : null;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/${workspace}/courses/${courseId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> {course.name}
      </Link>

      <PageHeader
        title={assignment.title}
        action={
          assignment.points != null ? (
            <Badge tone="primary">{assignment.points} points</Badge>
          ) : null
        }
      />
      {assignment.dueAt ? (
        <p className="-mt-3 mb-6 flex items-center gap-1.5 text-sm text-muted">
          <CalendarClock className="size-4" />
          Due {formatDateTime(assignment.dueAt)}
        </p>
      ) : null}

      {assignment.details ? (
        <Card className="mb-6">
          <CardContent className="p-6">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {assignment.details}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Student view */}
      {!staff ? (
        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-ink">Your submission</h2>
              {mine?.submittedAt ? (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                    <CheckCircle2 className="size-4" />
                    Submitted {formatDateTime(mine.submittedAt)}
                  </div>
                  <a
                    href={dl(mine.filePath)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-line bg-cream/50 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-cream"
                  >
                    <FileText className="size-4 text-primary" />
                    {mine.fileName}
                    <Download className="size-4 text-muted" />
                  </a>
                  {mine.grade != null ? (
                    <div className="rounded-2xl border border-line bg-surface p-4">
                      <p className="text-sm font-bold text-ink">
                        Grade: {mine.grade}
                        {assignment.points != null ? ` / ${assignment.points}` : ""}
                      </p>
                      <StructuredFeedback submission={mine} />
                    </div>
                  ) : (
                    <p className="text-sm text-muted">Not graded yet.</p>
                  )}
                  <div className="border-t border-line pt-4">
                    <p className="mb-2 text-sm font-semibold text-ink">
                      Need to resubmit?
                    </p>
                    <SubmitAssignmentForm
                      slug={workspace}
                      courseId={courseId}
                      assignmentId={assignmentId}
                      resubmit
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <SubmitAssignmentForm
                    slug={workspace}
                    courseId={courseId}
                    assignmentId={assignmentId}
                  />
                </div>
              )}
            </CardContent>
          </Card>
          <StudentHintPanel
            workspace={workspace}
            courseId={courseId}
            context={`Assignment: ${assignment.title}\n${assignment.details}`}
          />
        </div>
      ) : (
        /* Staff view */
        <div>
          <h2 className="mb-3 text-lg font-bold text-ink">
            Submissions ({submissions.length})
          </h2>
          {submissions.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No submissions yet"
              description="Submissions will appear here as students turn in their work."
            />
          ) : (
            <div className="space-y-3">
              {submissions.map((s) => (
                <Card key={s.userId}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <Avatar
                        name={s.studentName}
                        email={s.studentEmail}
                        className="size-9"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">
                          {s.studentName || s.studentEmail}
                        </p>
                        <p className="text-xs text-muted">
                          {s.submittedAt
                            ? `Submitted ${formatDateTime(s.submittedAt)}`
                            : "Not submitted"}
                        </p>
                      </div>
                      {s.filePath ? (
                        <a
                          href={dl(s.filePath)}
                          className="inline-flex items-center gap-2 rounded-pill border border-line px-3 py-1.5 text-sm font-semibold text-ink hover:bg-cream"
                        >
                          <Download className="size-4 text-primary" />
                          {s.fileName}
                        </a>
                      ) : null}
                    </div>
                    <div className="mt-4 border-t border-line pt-4">
                      <GradeForm
                        slug={workspace}
                        courseId={courseId}
                        assignmentId={assignmentId}
                        studentId={s.userId}
                        initialGrade={s.grade}
                        initialFeedback={s.feedback}
                        initialFeedbackStrengths={s.feedbackStrengths}
                        initialFeedbackNeeds={s.feedbackNeeds}
                        initialFeedbackNext={s.feedbackNext}
                        initialSkillTags={s.skillTags}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StructuredFeedback({
  submission,
}: {
  submission: {
    feedback: string;
    feedbackStrengths: string;
    feedbackNeeds: string;
    feedbackNext: string;
    skillTags: string[];
  };
}) {
  const rows = [
    ["Strengths", submission.feedbackStrengths],
    ["Needs improvement", submission.feedbackNeeds],
    ["Next step", submission.feedbackNext],
  ].filter(([, value]) => Boolean(value));

  if (rows.length === 0 && !submission.feedback && submission.skillTags.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3">
      {rows.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-cream/60 p-3">
              <p className="text-xs font-bold uppercase text-muted">{label}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                {value}
              </p>
            </div>
          ))}
        </div>
      ) : submission.feedback ? (
        <p className="text-sm text-muted">{submission.feedback}</p>
      ) : null}
      {submission.skillTags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {submission.skillTags.map((tag) => (
            <span
              key={tag}
              className="rounded-pill bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

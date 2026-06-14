import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Plus } from "lucide-react";
import { can, isStaff, requireMembership } from "@/lib/tenant";
import { getCourse } from "@/lib/firebase-data";
import { listAssessments } from "@/lib/firebase-assessments";
import { CourseTabs } from "@/components/workspace/course-tabs";
import { NotConnected } from "@/components/workspace/not-connected";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export default async function AssessmentsPage({
  params,
}: {
  params: Promise<{ workspace: string; courseId: string }>;
}) {
  const { workspace, courseId } = await params;
  const ctx = await requireMembership(workspace);
  const staff = isStaff(ctx.role);

  if (ctx.tenant.firebase?.status !== "ACTIVE") {
    return (
      <div className="mx-auto max-w-4xl">
        <NotConnected slug={workspace} isOwner={ctx.role === "OWNER"} />
      </div>
    );
  }

  const course = await getCourse(ctx.tenant.id, courseId);
  if (!course) notFound();
  const assessments = await listAssessments(ctx.tenant.id, courseId);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/${workspace}/courses/${courseId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> {course.name}
      </Link>
      <CourseTabs workspace={workspace} courseId={courseId} staff={staff} />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Quizzes</h1>
        {can(ctx.role, "content.author") ? (
          <Link
            href={`/${workspace}/courses/${courseId}/assessments/new`}
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="size-4" /> New quiz
          </Link>
        ) : null}
      </div>

      {assessments.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No quizzes yet"
          description={
            staff ? "Create a quiz to assess your students." : "Nothing to take yet."
          }
        />
      ) : (
        <div className="space-y-3">
          {assessments.map((a) => (
            <Link
              key={a.id}
              href={`/${workspace}/courses/${courseId}/assessments/${a.id}`}
              className="block"
            >
              <Card className="flex items-center gap-4 p-4 transition-transform duration-200 hover:-translate-y-0.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-purple/12 text-purple">
                  <ClipboardCheck className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{a.title}</p>
                  <p className="text-xs text-muted">
                    {a.questions.length} question
                    {a.questions.length === 1 ? "" : "s"} · {a.totalPoints} pts
                    {a.dueAt ? ` · due ${formatDateTime(a.dueAt)}` : ""}
                  </p>
                </div>
                <Badge tone="purple">{staff ? "Open" : "Take"}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { can, requireMembership } from "@/lib/tenant";
import { getCourse } from "@/lib/firebase-data";
import { PageHeader } from "@/components/workspace/page-header";
import { QuizBuilder } from "@/components/workspace/quiz-builder";

export default async function NewAssessmentPage({
  params,
}: {
  params: Promise<{ workspace: string; courseId: string }>;
}) {
  const { workspace, courseId } = await params;
  const ctx = await requireMembership(workspace);
  if (!can(ctx.role, "content.author")) redirect(`/${workspace}/courses/${courseId}`);
  if (ctx.tenant.firebase?.status !== "ACTIVE")
    redirect(`/${workspace}/courses/${courseId}`);

  const course = await getCourse(ctx.tenant.id, courseId);
  if (!course) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/${workspace}/courses/${courseId}/assessments`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Quizzes
      </Link>
      <PageHeader title="New quiz" description={course.name} />
      <QuizBuilder workspace={workspace} courseId={courseId} />
    </div>
  );
}

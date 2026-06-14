import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessagesSquare } from "lucide-react";
import { isStaff, requireMembership } from "@/lib/tenant";
import { getCourse } from "@/lib/firebase-data";
import { listDiscussions } from "@/lib/firebase-discussions";
import { createDiscussionAction } from "@/lib/actions/discussions";
import { CourseTabs } from "@/components/workspace/course-tabs";
import { NotConnected } from "@/components/workspace/not-connected";
import { ModalForm } from "@/components/workspace/modal-form";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";

export default async function DiscussionsPage({
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
  const discussions = await listDiscussions(ctx.tenant.id, courseId);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/${workspace}/courses/${courseId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> {course.name}
      </Link>
      <CourseTabs workspace={workspace} courseId={courseId} staff={staff} />

      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Discussions</h1>
        <ModalForm
          triggerLabel="New discussion"
          triggerIcon="plus"
          title="Start a discussion"
          submitLabel="Post"
          action={createDiscussionAction.bind(null, workspace, courseId)}
        >
          <div>
            <Label htmlFor="d-title">Topic</Label>
            <Input id="d-title" name="title" placeholder="Ask a question or start a conversation" required />
          </div>
        </ModalForm>
      </div>

      {discussions.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No discussions yet"
          description="Start a conversation — ask a question or share something with the class."
        />
      ) : (
        <div className="space-y-3">
          {discussions.map((d) => (
            <Link
              key={d.id}
              href={`/${workspace}/courses/${courseId}/discussions/${d.id}`}
              className="block"
            >
              <Card className="flex items-center gap-4 p-4 transition-transform duration-200 hover:-translate-y-0.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal/15 text-[#0f8a98]">
                  <MessagesSquare className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{d.title}</p>
                  <p className="text-xs text-muted">
                    {d.authorName} · {formatDate(d.createdAt)}
                  </p>
                </div>
                <Badge tone="neutral">
                  {d.replyCount} {d.replyCount === 1 ? "reply" : "replies"}
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

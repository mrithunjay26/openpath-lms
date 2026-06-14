import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { isStaff, requireMembership } from "@/lib/tenant";
import { getDiscussion, listPosts } from "@/lib/firebase-discussions";
import { deletePostAction } from "@/lib/actions/discussions";
import { ReplyForm } from "@/components/workspace/reply-form";
import { NotConnected } from "@/components/workspace/not-connected";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/utils";

export default async function DiscussionThreadPage({
  params,
}: {
  params: Promise<{ workspace: string; courseId: string; discussionId: string }>;
}) {
  const { workspace, courseId, discussionId } = await params;
  const ctx = await requireMembership(workspace);
  const staff = isStaff(ctx.role);

  if (ctx.tenant.firebase?.status !== "ACTIVE") {
    return (
      <div className="mx-auto max-w-3xl">
        <NotConnected slug={workspace} isOwner={ctx.role === "OWNER"} />
      </div>
    );
  }

  const [discussion, posts] = await Promise.all([
    getDiscussion(ctx.tenant.id, courseId, discussionId),
    listPosts(ctx.tenant.id, courseId, discussionId),
  ]);
  if (!discussion) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/${workspace}/courses/${courseId}/discussions`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Discussions
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight text-ink">
        {discussion.title}
      </h1>
      <p className="mt-1 text-sm text-muted">
        Started by {discussion.authorName}
      </p>

      <div className="mt-6 space-y-3">
        {posts.length === 0 ? (
          <p className="text-sm text-muted">No replies yet. Be the first.</p>
        ) : (
          posts.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2.5">
                  <Avatar name={p.authorName} className="size-7" />
                  <span className="text-sm font-semibold text-ink">
                    {p.authorName}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDateTime(p.createdAt)}
                  </span>
                  {staff ? (
                    <form
                      action={deletePostAction.bind(
                        null,
                        workspace,
                        courseId,
                        discussionId,
                        p.id,
                      )}
                      className="ml-auto"
                    >
                      <button
                        type="submit"
                        className="grid size-7 place-items-center rounded-lg text-muted hover:bg-rose-50 hover:text-rose-600"
                        title="Delete (moderation)"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </form>
                  ) : null}
                </div>
                <p className="mt-2 whitespace-pre-wrap pl-9 text-sm text-ink">
                  {p.body}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="mt-6">
        <ReplyForm
          workspace={workspace}
          courseId={courseId}
          discussionId={discussionId}
        />
      </div>
    </div>
  );
}

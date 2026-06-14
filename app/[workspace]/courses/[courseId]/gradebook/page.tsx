import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { isStaff, requireMembership } from "@/lib/tenant";
import { computeGradebook } from "@/lib/gradebook";
import { CourseTabs } from "@/components/workspace/course-tabs";
import { NotConnected } from "@/components/workspace/not-connected";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default async function GradebookPage({
  params,
}: {
  params: Promise<{ workspace: string; courseId: string }>;
}) {
  const { workspace, courseId } = await params;
  const ctx = await requireMembership(workspace);
  if (!isStaff(ctx.role)) redirect(`/${workspace}/courses/${courseId}`);
  const connected = ctx.tenant.firebase?.status === "ACTIVE";

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/${workspace}/courses/${courseId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Back to course
      </Link>
      <CourseTabs workspace={workspace} courseId={courseId} staff />

      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Gradebook</h1>
        <a
          href={`/api/${workspace}/courses/${courseId}/gradebook`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Download className="size-4" /> Export CSV
        </a>
      </div>

      {!connected ? (
        <NotConnected slug={workspace} isOwner={ctx.role === "OWNER"} />
      ) : (
        <Suspense fallback={<Skeleton className="h-64" />}>
          <GradebookTable tenantId={ctx.tenant.id} courseId={courseId} />
        </Suspense>
      )}
    </div>
  );
}

async function GradebookTable({
  tenantId,
  courseId,
}: {
  tenantId: string;
  courseId: string;
}) {
  const gb = await computeGradebook(tenantId, courseId);

  if (gb.rows.length === 0) {
    return (
      <EmptyState
        title="No students yet"
        description="Once students enroll and complete work, grades appear here."
      />
    );
  }

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="sticky left-0 bg-surface px-4 py-3 text-left font-semibold text-muted">
                Student
              </th>
              {gb.columns.map((c) => (
                <th
                  key={c.id}
                  className="px-3 py-3 text-center font-semibold text-ink"
                >
                  <span className="block max-w-28 truncate" title={c.title}>
                    {c.title}
                  </span>
                  <span className="text-xs font-normal text-muted">
                    /{c.points}
                  </span>
                </th>
              ))}
              <th className="px-3 py-3 text-center font-semibold text-ink">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {gb.rows.map((r) => (
              <tr key={r.userId} className="border-b border-line last:border-0">
                <td className="sticky left-0 bg-surface px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={r.name} email={r.email} className="size-7" />
                    <span className="max-w-36 truncate font-medium text-ink">
                      {r.name || r.email}
                    </span>
                  </div>
                </td>
                {gb.columns.map((c) => (
                  <td key={c.id} className="px-3 py-3 text-center text-muted">
                    {r.cells[c.id] == null ? "—" : r.cells[c.id]}
                  </td>
                ))}
                <td className="px-3 py-3 text-center">
                  <span
                    className={cn(
                      "font-bold",
                      r.percent == null
                        ? "text-muted"
                        : r.percent >= 70
                          ? "text-[#2f8a51]"
                          : r.percent >= 50
                            ? "text-[#9a7b12]"
                            : "text-rose-600",
                    )}
                  >
                    {r.percent == null ? "—" : `${r.percent}%`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

import { redirect } from "next/navigation";
import { can, requireMembership } from "@/lib/tenant";
import { buildImpactReport } from "@/lib/reporting";
import { PageHeader } from "@/components/workspace/page-header";
import { NotConnected } from "@/components/workspace/not-connected";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  const ctx = await requireMembership(workspace);
  if (!can(ctx.role, "people.manage")) redirect(`/${workspace}`);
  if (ctx.tenant.firebase?.status !== "ACTIVE") {
    return <NotConnected slug={workspace} isOwner={ctx.role === "OWNER"} />;
  }
  const report = await buildImpactReport(ctx.tenant.id);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Impact reporting"
        description="Grant and nonprofit-ready reach, engagement, and growth metrics."
        action={
          <a href={`/api/${workspace}/reports/impact`}>
            <Button type="button">Download PDF</Button>
          </a>
        }
      />
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Metric label="Students" value={report.studentCount} />
        <Metric label="Courses" value={report.courseCount} />
        <Metric label="Submissions" value={report.submissionCount} />
        <Metric
          label="Avg score"
          value={
            report.averageScore == null
              ? "N/A"
              : `${Math.round(report.averageScore * 100)}%`
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Course reach</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.courseRows.map((row) => (
              <div key={row.name} className="rounded-2xl bg-cream/60 p-3">
                <p className="font-bold text-ink">{row.name}</p>
                <p className="text-sm text-muted">
                  {row.students} learners · {row.assignments} assignments · {row.assessments} quizzes · {row.submissions} submissions
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Skill evidence</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {report.skillEvidence.length === 0 ? (
              <p className="text-sm text-muted">No skill evidence yet.</p>
            ) : (
              report.skillEvidence.map((skill) => (
                <Badge key={skill.skill} tone="teal">
                  {skill.skill}: {skill.count}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs font-bold uppercase text-muted">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-ink">{value}</p>
    </div>
  );
}

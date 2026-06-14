import Link from "next/link";
import { Award, BookOpen, FileText } from "lucide-react";
import { requireMembership } from "@/lib/tenant";
import { getStudentPortfolio } from "@/lib/portfolio";
import { PageHeader } from "@/components/workspace/page-header";
import { NotConnected } from "@/components/workspace/not-connected";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  const ctx = await requireMembership(workspace);
  if (ctx.tenant.firebase?.status !== "ACTIVE") {
    return <NotConnected slug={workspace} isOwner={ctx.role === "OWNER"} />;
  }

  const portfolio = await getStudentPortfolio(ctx.tenant.id, ctx.user.id);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Portfolio"
        description="A student-facing record of artifacts, growth, skills, and badges."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Metric label="Courses" value={portfolio.courses.length} />
        <Metric label="Artifacts" value={portfolio.artifacts.length} />
        <Metric label="Skills" value={portfolio.skills.length} />
      </div>

      {portfolio.badges.length > 0 ? (
        <div className="mb-6 grid gap-3 md:grid-cols-2">
          {portfolio.badges.map((badge) => (
            <div key={badge.id} className="rounded-2xl border border-line bg-surface p-4">
              <Badge tone={badge.tone}>{badge.title}</Badge>
              <p className="mt-2 text-sm text-muted">{badge.description}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Artifacts</CardTitle>
          </CardHeader>
          <CardContent>
            {portfolio.artifacts.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No artifacts yet"
                description="Submit assignments or quizzes to start building your portfolio."
              />
            ) : (
              <div className="space-y-3">
                {portfolio.artifacts.map((artifact) => (
                  <Link
                    key={`${artifact.type}-${artifact.id}`}
                    href={`/${workspace}/courses/${artifact.courseId}`}
                    className="block rounded-2xl border border-line bg-background/50 p-4 hover:bg-cream/50"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={artifact.type === "quiz" ? "purple" : "primary"}>
                        {artifact.type}
                      </Badge>
                      <p className="font-bold text-ink">{artifact.title}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {artifact.courseName}
                      {artifact.submittedAt
                        ? ` · ${formatDateTime(artifact.submittedAt)}`
                        : ""}
                    </p>
                    {artifact.score != null ? (
                      <p className="mt-2 text-sm font-semibold text-ink">
                        Score: {artifact.score}
                        {artifact.points != null ? ` / ${artifact.points}` : ""}
                      </p>
                    ) : null}
                    {artifact.skillTags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {artifact.skillTags.map((tag) => (
                          <Badge key={tag} tone="teal">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skill growth</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {portfolio.skills.length === 0 ? (
              <p className="text-sm text-muted">Skill evidence appears as work is graded.</p>
            ) : (
              portfolio.skills.map((skill) => (
                <div key={skill.skill} className="rounded-2xl bg-cream/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-ink">{skill.skill}</p>
                    <span className="text-xs font-semibold text-muted">
                      {skill.average == null
                        ? "No score"
                        : `${Math.round(skill.average * 100)}%`}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {skill.evidence} evidence point{skill.evidence === 1 ? "" : "s"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted">
        {label === "Courses" ? <BookOpen className="size-4" /> : <Award className="size-4" />}
        {label}
      </div>
      <p className="mt-2 text-3xl font-extrabold text-ink">{value}</p>
    </div>
  );
}

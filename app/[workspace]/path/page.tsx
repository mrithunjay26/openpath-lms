import Link from "next/link";
import { ArrowRight, Route } from "lucide-react";
import { requireMembership } from "@/lib/tenant";
import { getStudentPortfolio, buildMasterySteps } from "@/lib/portfolio";
import { matchOpportunities, getOpportunities } from "@/lib/opportunities";
import { PageHeader } from "@/components/workspace/page-header";
import { NotConnected } from "@/components/workspace/not-connected";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MasteryPathPage({
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
  const steps = buildMasterySteps(portfolio);
  const skills = portfolio.skills.map((s) => s.skill);
  const opportunities = matchOpportunities(skills, await getOpportunities()).slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Mastery path"
        description="A simple growth map from current evidence to next opportunity."
      />

      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card key={step.title}>
            <CardContent className="flex gap-4 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 font-bold text-primary">
                {index + 1}
              </span>
              <div>
                <h2 className="font-bold text-ink">{step.title}</h2>
                <p className="mt-1 text-sm text-muted">{step.body}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-7">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ink">
          <Route className="size-5 text-primary" />
          Matched next steps
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {opportunities.map((opp) => (
            <a
              key={opp.id}
              href={opp.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-line bg-surface p-4 hover:bg-cream/40"
            >
              <Badge tone="teal">{opp.type}</Badge>
              <p className="mt-2 font-bold text-ink">{opp.title}</p>
              <p className="mt-1 text-sm text-muted">{opp.org}</p>
            </a>
          ))}
        </div>
        <Link
          href={`/${workspace}/opportunities`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary"
        >
          See all opportunities <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ExternalLink, Search, Sparkles } from "lucide-react";
import { isStaff, requireMembership } from "@/lib/tenant";
import { listCoursesForStudent } from "@/lib/firebase-data";
import {
  getOpportunitySubjects,
  listOpportunities,
  matchOpportunities,
  OPP_TYPE_LABEL,
  type Opportunity,
} from "@/lib/opportunities";
import { PageHeader } from "@/components/workspace/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MODES = ["Virtual", "In Person", "Hybrid", "Remote", "Residential"];
const GRADES = ["9", "10", "11", "12"];

type Filters = {
  q?: string;
  subject?: string;
  mode?: string;
  grade?: string;
  free?: string;
};

export default async function OpportunitiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<Filters>;
}) {
  const { workspace } = await params;
  const filters = await searchParams;
  const ctx = await requireMembership(workspace);
  const staff = isStaff(ctx.role);
  const free = filters.free === "1";

  // Student skill matching (best-effort) + catalog + subject facets in parallel.
  const skillsPromise =
    !staff && ctx.tenant.firebase?.status === "ACTIVE"
      ? listCoursesForStudent(ctx.tenant.id, ctx.user.id)
          .then((courses) => [...new Set(courses.flatMap((c) => c.skills))])
          .catch(() => [])
      : Promise.resolve<string[]>([]);

  const [skills, subjects, catalog] = await Promise.all([
    skillsPromise,
    getOpportunitySubjects(),
    listOpportunities({
      q: filters.q,
      subject: filters.subject,
      mode: filters.mode,
      grade: filters.grade,
      free,
      limit: 120,
    }),
  ]);

  const ranked = skills.length > 0 ? matchOpportunities(skills, catalog) : catalog;
  const hasFilters = Boolean(
    filters.q || filters.subject || filters.mode || filters.grade || free,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        eyebrow="Extracurricular studio"
        title="Opportunities"
        description="Search a live database of internships, research, programs, and service — filter by subject, format, grade, and cost."
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5 text-primary" />
            Find the right next step
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-3 lg:grid-cols-[1.4fr_0.9fr_0.8fr_0.7fr_auto]">
            <Input
              name="q"
              defaultValue={filters.q}
              placeholder="Search title, org, subject, or location"
            />
            <FilterSelect name="subject" defaultValue={filters.subject ?? ""} placeholder="All subjects">
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect name="mode" defaultValue={filters.mode ?? ""} placeholder="Any format">
              {MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect name="grade" defaultValue={filters.grade ?? ""} placeholder="Any grade">
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </FilterSelect>
            <Button type="submit" className="w-full">
              Filter
            </Button>
            <label className="col-span-full flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold text-muted">
              <input
                type="checkbox"
                name="free"
                value="1"
                defaultChecked={free}
                className="size-4 accent-[var(--color-primary)]"
              />
              Free / no-cost only
            </label>
          </form>

          {subjects.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <SubjectChip workspace={workspace} filters={filters} subject="" active={!filters.subject}>
                All
              </SubjectChip>
              {subjects.slice(0, 12).map((s) => (
                <SubjectChip
                  key={s}
                  workspace={workspace}
                  filters={filters}
                  subject={s}
                  active={filters.subject === s}
                >
                  {s}
                </SubjectChip>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Results shown" value={ranked.length} />
        <Metric label="Skills matched" value={skills.length} />
        <Metric label="Subjects" value={subjects.length} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">
            {hasFilters ? "Filtered results" : "Browse opportunities"}
          </h2>
          <p className="text-sm text-muted">
            {skills.length > 0
              ? "Ranked by subject overlap with your courses."
              : "Newest first."}
          </p>
        </div>
        {ranked.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center text-sm text-muted">
              No opportunities match these filters. Try clearing some.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {ranked.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterSelect({
  name,
  defaultValue,
  placeholder,
  children,
}: {
  name: string;
  defaultValue: string;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="h-11 w-full rounded-[var(--radius-card)] border border-line bg-background px-4 text-sm text-ink shadow-sm outline-none"
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}

function SubjectChip({
  workspace,
  filters,
  subject,
  active,
  children,
}: {
  workspace: string;
  filters: Filters;
  subject: string;
  active: boolean;
  children: React.ReactNode;
}) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (subject) params.set("subject", subject);
  if (filters.mode) params.set("mode", filters.mode);
  if (filters.grade) params.set("grade", filters.grade);
  if (filters.free === "1") params.set("free", "1");
  const query = params.toString();
  return (
    <Link
      href={`/${workspace}/opportunities${query ? `?${query}` : ""}`}
      className={`rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors ${
        active ? "bg-primary/15 text-ink" : "bg-white/5 text-muted hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function OpportunityCard({ opp }: { opp: Opportunity }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardContent className="space-y-4 pt-[var(--workspace-card-padding)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge tone="teal">{OPP_TYPE_LABEL[opp.type]}</Badge>
            <h3 className="mt-3 text-lg font-bold text-ink">{opp.title}</h3>
            <p className="mt-1 text-sm text-muted">{opp.org}</p>
          </div>
        </div>

        {opp.description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted">
            {opp.description}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          {opp.location ? <Badge tone="primary">{opp.location}</Badge> : null}
          {opp.mode ? <Badge tone="teal">{opp.mode}</Badge> : null}
          {opp.cost ? <Badge tone="neutral">{opp.cost}</Badge> : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {opp.gradeLevels.length > 0 ? (
            <MetaPill label="Grades" value={opp.gradeLevels.slice(0, 4).join(", ")} />
          ) : null}
          {opp.salary ? <MetaPill label="Stipend" value={opp.salary} /> : null}
          {opp.deadline ? <MetaPill label="Deadline" value={opp.deadline} /> : null}
          {opp.source ? <MetaPill label="Source" value={opp.source} /> : null}
        </div>

        {opp.subjects.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {opp.subjects.slice(0, 5).map((s) => (
              <span
                key={s}
                className="rounded-pill bg-white/5 px-2.5 py-1 text-xs font-semibold text-muted"
              >
                {s}
              </span>
            ))}
          </div>
        ) : null}

        {opp.url ? (
          <a
            href={opp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Learn more <ExternalLink className="size-3.5" />
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-background/50 px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 pt-[var(--workspace-card-padding)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            {label}
          </p>
          <p className="mt-2 text-3xl font-extrabold text-ink">{value}</p>
        </div>
        <div className="grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary">
          <Sparkles className="size-6" />
        </div>
      </CardContent>
    </Card>
  );
}

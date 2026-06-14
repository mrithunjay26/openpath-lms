import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Compass,
  ExternalLink,
  GraduationCap,
  PlusCircle,
  Sparkles,
  Users,
  ShieldAlert,
  Trophy,
  LayoutDashboard,
} from "lucide-react";
import { isStaff, requireMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import {
  listCourses,
  listCoursesForStudent,
  type Course,
} from "@/lib/firebase-data";
import {
  getOpportunities,
  matchOpportunities,
  OPP_TYPE_LABEL,
  type Opportunity,
} from "@/lib/opportunities";
import { NotConnected } from "@/components/workspace/not-connected";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function WorkspaceDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { workspace } = await params;
  const { welcome } = await searchParams;
  const ctx = await requireMembership(workspace);
  const staff = isStaff(ctx.role);
  const connected = ctx.tenant.firebase?.status === "ACTIVE";
  const firstName = (ctx.user.name || "there").split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {welcome ? (
        <Alert tone="success">
          Your workspace is ready.{" "}
          {staff
            ? "Connect Firebase if needed, then create your first course."
            : "Browse your courses and opportunities below."}
        </Alert>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-accent/10" />
          <CardContent className="relative space-y-5 pt-[var(--workspace-card-padding)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">
                  {staff ? "Workspace command center" : "Learner dashboard"}
                </p>
                <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                  Welcome back, {firstName}
                </h1>
                <p className="mt-3 max-w-2xl text-muted">
                  {staff
                    ? "Track activity, launch courses, and keep the workspace moving without hunting through menus."
                    : "See what is due, where to go next, and which opportunities fit the skills you're building."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {staff && connected ? (
                  <Link
                    href={`/${workspace}/courses`}
                    className={buttonVariants({ size: "sm" })}
                  >
                    <PlusCircle className="size-4" />
                    New course
                  </Link>
                ) : null}
                <Link
                  href={`/${workspace}/opportunities`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Compass className="size-4" />
                  Explore opportunities
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <QuickAction
                icon={LayoutDashboard}
                title="Home"
                desc="Overview, tasks, and next steps"
                href={`/${workspace}`}
              />
              <QuickAction
                icon={BookOpen}
                title={staff ? "Courses" : "My courses"}
                desc="Browse live classes and content"
                href={`/${workspace}/courses`}
              />
              <QuickAction
                icon={Trophy}
                title="Portfolio"
                desc="Evidence, milestones, and growth"
                href={`/${workspace}/portfolio`}
              />
              <QuickAction
                icon={Sparkles}
                title="Resources"
                desc="Guides and community support"
                href={`/${workspace}/resources`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Next best action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-[var(--workspace-card-padding)]">
            {!connected ? (
              <ActionCallout
                icon={ShieldAlert}
                tone="yellow"
                title="Connect Firebase"
                body="Courses, assignments, and files unlock after the workspace connection is live."
                href={`/${workspace}/settings/firebase`}
                label="Open setup"
              />
            ) : staff && ctx.tenant.firebase?.status === "ACTIVE" ? (
              <ActionCallout
                icon={PlusCircle}
                tone="primary"
                title="Create a course"
                body="Start with a course shell, then add modules, assignments, and learners."
                href={`/${workspace}/courses`}
                label="New course"
              />
            ) : (
              <ActionCallout
                icon={Compass}
                tone="teal"
                title="Explore opportunities"
                body="Find internships, service, and mentorship opportunities matched to course skills."
                href={`/${workspace}/opportunities`}
                label="Browse"
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Workspace" value={ctx.tenant.name} />
              <MiniStat label="Role" value={ctx.role} />
            </div>
          </CardContent>
        </Card>
      </section>

      {!connected ? (
        <NotConnected slug={workspace} isOwner={ctx.role === "OWNER"} />
      ) : (
        <Suspense fallback={<DashboardSkeleton staff={staff} />}>
          <DashboardBody
            workspace={workspace}
            tenantId={ctx.tenant.id}
            userId={ctx.user.id}
            staff={staff}
          />
        </Suspense>
      )}
    </div>
  );
}

async function DashboardBody({
  workspace,
  tenantId,
  userId,
  staff,
}: {
  workspace: string;
  tenantId: string;
  userId: string;
  staff: boolean;
}) {
  const countsPromise = Promise.all([
    prisma.membership.count({ where: { tenantId, role: "STUDENT" } }),
    prisma.membership.count({ where: { tenantId } }),
  ]);
  const coursesPromise = staff
    ? listCourses(tenantId)
    : listCoursesForStudent(tenantId, userId);
  const opportunitiesPromise = getOpportunities();

  try {
    const [counts, loadedCourses, allOpportunities] = await Promise.all([
      countsPromise,
      coursesPromise,
      opportunitiesPromise,
    ]);
    const [studentCount, memberCount] = counts;
    const courses = loadedCourses;

    const skills = staff
      ? []
      : [...new Set(courses.flatMap((course) => course.skills))];
    const opportunities = staff
      ? allOpportunities.slice(0, 3)
      : matchOpportunities(skills, allOpportunities).slice(0, 3);

    if (courses.length === 0) {
      return (
        <EmptyState
          icon={BookOpen}
          title={staff ? "No courses yet" : "You're not enrolled in any courses"}
          description={
            staff
              ? "Create your first course to start adding assignments, modules, and students."
              : "Once a teacher enrolls you, your classes will appear here."
          }
          action={
            staff ? (
              <Link
                href={`/${workspace}/courses`}
                className={buttonVariants({ variant: "accent" })}
              >
                <Sparkles className="size-4" />
                Create a course
              </Link>
            ) : (
              <Link href="/join" className={buttonVariants()}>
                Enter a join code
              </Link>
            )
          }
        />
      );
    }

    return (
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          {staff ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard icon={BookOpen} label="Courses" value={courses.length} tone="primary" />
              <StatCard icon={Users} label="Members" value={memberCount} tone="teal" />
              <StatCard icon={GraduationCap} label="Students" value={studentCount} tone="pink" />
            </div>
          ) : null}

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-ink">
                {staff ? "Courses at a glance" : "Your courses"}
              </h2>
              {staff ? (
                <Link
                  href={`/${workspace}/courses`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  View all <ArrowRight className="size-4" />
                </Link>
              ) : null}
            </div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} workspace={workspace} course={course} />
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Impact snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-[var(--workspace-card-padding)]">
              <ImpactRow label="Active members" value={memberCount} />
              <ImpactRow label="Learners" value={studentCount} valueTone="primary" />
              <ImpactRow
                label="Course opportunities"
                value={opportunities.length}
                valueTone="teal"
              />
              <Link
                href={`/${workspace}/reports`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Open reporting <ArrowRight className="size-4" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>
                <Compass className="mr-2 inline size-5 text-primary" />
                Recommended next steps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-[var(--workspace-card-padding)]">
              {opportunities.map((opp) => (
                <OpportunityCard key={opp.id} opp={opp} />
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load dashboard.";
    return <Alert tone="error">{message}</Alert>;
  }
}

function DashboardSkeleton({ staff }: { staff: boolean }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
      <div className="space-y-6">
        {staff ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : null}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-52" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  desc,
  href,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link href={href} className="group">
      <div className="flex h-full flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-background/60 p-4 transition-transform duration-200 group-hover:-translate-y-0.5">
        <div className="grid size-11 place-items-center rounded-2xl bg-primary/12 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <div className="font-semibold text-ink">{title}</div>
          <p className="mt-1 text-sm text-muted">{desc}</p>
        </div>
      </div>
    </Link>
  );
}

function ActionCallout({
  icon: Icon,
  tone,
  title,
  body,
  href,
  label,
}: {
  icon: React.ElementType;
  tone: "primary" | "teal" | "yellow";
  title: string;
  body: string;
  href: string;
  label: string;
}) {
  const toneClass = {
    primary: "bg-primary/12 text-primary",
    teal: "bg-teal/12 text-teal",
    yellow: "bg-yellow/15 text-yellow",
  }[tone];
  return (
    <Link href={href} className="block">
      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4 transition-transform duration-200 hover:-translate-y-0.5">
        <div className="flex items-start gap-3">
          <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", toneClass)}>
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ink">{title}</p>
            <p className="mt-1 text-sm text-muted">{body}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              {label}
              <ArrowRight className="size-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-background/60 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function ImpactRow({
  label,
  value,
  valueTone = "ink",
}: {
  label: string;
  value: number;
  valueTone?: "ink" | "primary" | "teal";
}) {
  const tone = {
    ink: "text-ink",
    primary: "text-primary",
    teal: "text-teal",
  }[valueTone];
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
      <span className="text-sm text-muted">{label}</span>
      <span className={cn("text-lg font-extrabold", tone)}>{value}</span>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: "primary" | "teal" | "pink";
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    teal: "bg-teal/15 text-[#0f8a98]",
    pink: "bg-pink/12 text-pink",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-[var(--workspace-card-padding)]">
        <span className={cn("grid size-12 place-items-center rounded-2xl", toneCls)}>
          <Icon className="size-6" />
        </span>
        <div>
          <p className="text-2xl font-extrabold text-ink">{value}</p>
          <p className="text-sm text-muted">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CourseCard({
  workspace,
  course,
}: {
  workspace: string;
  course: Course;
}) {
  return (
    <Link href={`/${workspace}/courses/${course.id}`} className="group">
      <Card className="h-full overflow-hidden transition-transform duration-200 group-hover:-translate-y-1">
      <CardContent className="space-y-4 pt-[var(--workspace-card-padding)]">
          <div className="flex items-center justify-between gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="size-5" />
            </span>
            {course.term ? <Badge>{course.term}</Badge> : null}
          </div>
          <div>
            <h3 className="font-bold text-ink">{course.name}</h3>
            {course.description ? (
              <p className="mt-1.5 line-clamp-3 text-sm text-muted">
                {course.description}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function OpportunityCard({ opp }: { opp: Opportunity }) {
  return (
    <a
      href={opp.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-[var(--radius-card)] border border-line bg-background/60 p-4 transition-transform duration-200 hover:-translate-y-0.5"
    >
      <Badge tone="teal">{OPP_TYPE_LABEL[opp.type]}</Badge>
      <h4 className="mt-3 font-bold text-ink">{opp.title}</h4>
      <p className="text-xs text-muted">{opp.org}</p>
      <p className="mt-2 line-clamp-3 text-sm text-muted">{opp.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {opp.location ? <Badge tone="neutral">{opp.location}</Badge> : null}
        {opp.mode ? <Badge tone="primary">{opp.mode}</Badge> : null}
        {opp.gradeLevels.slice(0, 2).map((grade) => (
          <Badge key={grade} tone="neutral">
            {grade}
          </Badge>
        ))}
      </div>
      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        Learn more <ExternalLink className="size-3.5" />
      </span>
    </a>
  );
}

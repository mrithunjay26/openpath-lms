import Link from "next/link";
import { ArrowRight, BookOpenCheck, HeartHandshake, Lightbulb, ShieldCheck, Sparkles, Users } from "lucide-react";
import { requireMembership, isStaff } from "@/lib/tenant";
import { PageHeader } from "@/components/workspace/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const GUIDES = [
  {
    title: "Launch your workspace fast",
    description:
      "Finish setup by connecting Firebase, branding the workspace, and creating the first course.",
    icon: Sparkles,
    audience: "Owner",
    steps: [
      "Open Settings to set colors, logo, density, and canvas width.",
      "Connect Firebase before creating courses or files.",
      "Create a join code for the first class and share it.",
    ],
    href: "/settings",
  },
  {
    title: "Build a strong course",
    description:
      "Use modules, assignments, quizzes, and discussions together so students always know the next step.",
    icon: BookOpenCheck,
    audience: "Teacher",
    steps: [
      "Draft a course shell, then add modules before publishing tasks.",
      "Set due dates so the calendar and agenda populate automatically.",
      "Use the gradebook and feedback fields to close the loop.",
    ],
    href: "/courses",
  },
  {
    title: "Support every student",
    description:
      "Join codes, portfolio evidence, and opportunities help students move from classwork to action.",
    icon: Users,
    audience: "Student",
    steps: [
      "Use /join to enter one or more course codes.",
      "Open the portfolio to capture work that demonstrates mastery.",
      "Check opportunities regularly for internships, mentoring, and service.",
    ],
    href: "/opportunities",
  },
  {
    title: "Use reporting for grants and nonprofits",
    description:
      "OpenPath can produce impact language for community partners, funders, and boards.",
    icon: HeartHandshake,
    audience: "Admin",
    steps: [
      "Collect enrollments, submissions, and quiz evidence from active courses.",
      "Export the impact report from Reports when you need a shareable summary.",
      "Pair reporting with your workspace branding for a polished external view.",
    ],
    href: "/reports",
  },
] as const;

const TIPS = [
  {
    title: "Use join codes per course",
    body: "Students can paste multiple course codes at once on /join, which makes onboarding fast for multi-class learners.",
  },
  {
    title: "Let the calendar do the work",
    body: "Set due dates in assignments and assessments so deadlines appear automatically in the calendar and dashboard agenda.",
  },
  {
    title: "Turn chat into coordination",
    body: "Use direct chats for 1:1 support, group chats for project teams, and file uploads for quick feedback loops.",
  },
  {
    title: "Treat opportunities like curriculum extensions",
    body: "Keep course skills aligned with real-world opportunities so students can see the path from assignment to action.",
  },
] as const;

export default async function ResourcesPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  const ctx = await requireMembership(workspace);
  const staff = isStaff(ctx.role);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Usage guide"
        title="Resources"
        description="Practical guidance for getting the most out of OpenPath in schools, clubs, and nonprofit programs."
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4">
          {GUIDES.map((guide) => (
            <Card key={guide.title}>
              <CardContent className="space-y-4 pt-[var(--workspace-card-padding)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
                      <guide.icon className="size-5" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-ink">{guide.title}</h2>
                        <Badge tone="primary">{guide.audience}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted">{guide.description}</p>
                    </div>
                  </div>
                  <Link
                    href={`/${workspace}${guide.href}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                  >
                    Open <ArrowRight className="size-4" />
                  </Link>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  {guide.steps.map((step, index) => (
                    <div key={step} className="rounded-2xl bg-background/50 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                        Step {index + 1}
                      </p>
                      <p className="mt-1 text-sm text-ink">{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="size-5 text-primary" />
                Tips to go further
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-[var(--workspace-card-padding)]">
              {TIPS.map((tip) => (
                <div key={tip.title} className="rounded-2xl bg-background/50 p-3">
                  <p className="font-semibold text-ink">{tip.title}</p>
                  <p className="mt-1 text-sm text-muted">{tip.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                Best practice checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-[var(--workspace-card-padding)]">
              {[
                "Set workspace colors and logo before inviting members.",
                "Add due dates to assignments so students see deadlines everywhere.",
                "Use the gradebook and feedback fields to keep learning loops closed.",
                "Keep opportunities aligned with the skills in your course syllabus.",
                "Export reporting when you need a grant or board-ready summary.",
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-background/50 px-3 py-2 text-sm text-ink">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>

      {staff ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Staff shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-[var(--workspace-card-padding)]">
            {[
              { label: "People", href: "/people" },
              { label: "Reports", href: "/reports" },
              { label: "Settings", href: "/settings" },
              { label: "Calendar", href: "/calendar" },
              { label: "Messages", href: "/messages" },
            ].map((item) => (
              <Link
                key={item.href}
                href={`/${workspace}${item.href}`}
                className="rounded-pill bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/15"
              >
                {item.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

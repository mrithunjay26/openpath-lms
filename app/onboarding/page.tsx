import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Database, Palette, Users } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { CreateWorkspaceForm } from "@/components/onboarding/create-workspace-form";
import { requireUser } from "@/lib/session";
import { canCreateWorkspace } from "@/lib/tenant";

export const metadata: Metadata = { title: "Create a workspace" };

export default async function OnboardingPage() {
  const user = await requireUser("/onboarding");
  const allowed = await canCreateWorkspace(user.id, user.platformRole);

  return (
    <div className="min-h-dvh bg-soft py-12">
      <Container className="max-w-5xl">
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" /> Back to workspaces
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              {allowed ? "Create a workspace" : "Join a workspace"}
            </h1>
            <p className="mt-3 text-lg text-muted">
              {allowed
                ? "Set up a new teaching or program space. Next you&apos;ll connect Firebase and make it yours."
                : "Students and TAs join existing spaces with a code or invite. Workspace creation stays with educators and operators."}
            </p>

            {allowed ? (
              <ul className="mt-8 space-y-4">
                <Step
                  icon={Users}
                  title="1. Name your workspace"
                  desc="Pick a name and a link. You're the owner."
                />
                <Step
                  icon={Database}
                  title="2. Connect your Firebase"
                  desc="Paste your service account - we encrypt it and verify it."
                />
                <Step
                  icon={Palette}
                  title="3. Brand & invite"
                  desc="Set your colors and logo, then invite students."
                />
              </ul>
            ) : (
              <div className="mt-8 rounded-[2rem] border border-line bg-surface p-6">
                <p className="font-semibold text-ink">What you can do instead</p>
                <ul className="mt-4 space-y-3 text-sm text-muted">
                  <li>Join a course or workspace with a code from your teacher or program lead.</li>
                  <li>Use your dashboard to track assignments, calendar items, messages, and opportunities.</li>
                  <li>Keep your focus on learning while educators manage the workspace setup.</li>
                </ul>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href="/join" className={buttonVariants({ variant: "accent" })}>
                    Join with a code
                  </Link>
                  <Link href="/app" className={buttonVariants({ variant: "outline" })}>
                    Back to workspaces
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Card className="p-6 sm:p-8">
            {allowed ? (
              <CreateWorkspaceForm />
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted">
                  Access restricted
                </p>
                <p className="text-sm text-muted">
                  Workspace creation is hidden for students and TAs. If you need
                  a classroom, club, or nonprofit space, ask the educator or
                  organizer to create one and share a join code.
                </p>
                <Link href="/join" className={buttonVariants({ variant: "primary", size: "lg" })}>
                  Join a workspace
                </Link>
              </div>
            )}
          </Card>
        </div>
      </Container>
    </div>
  );
}

function Step({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex gap-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface text-primary shadow-sm">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="font-bold text-ink">{title}</p>
        <p className="text-sm text-muted">{desc}</p>
      </div>
    </li>
  );
}

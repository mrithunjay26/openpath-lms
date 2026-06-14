import Link from "next/link";
import { CheckCircle2, ChevronRight, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import { requireMembership } from "@/lib/tenant";
import { readTheme } from "@/lib/theme";
import { PageHeader } from "@/components/workspace/page-header";
import { BrandingForm } from "@/components/workspace/branding-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  const ctx = await requireMembership(workspace, ["OWNER"]);
  const theme = readTheme(ctx.tenant.theme);
  const connected = ctx.tenant.firebase?.status === "ACTIVE";

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Workspace settings"
        title="Settings"
        description="Make this workspace yours and manage its connection."
      />

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>
            Your colors and logo flow through every teacher and student
            dashboard in this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrandingForm
            slug={ctx.tenant.slug}
            initialName={ctx.tenant.name}
            initialLogoUrl={ctx.tenant.logoUrl ?? ""}
            initialTheme={theme}
          />
        </CardContent>
      </Card>

      <Link href={`/${ctx.tenant.slug}/settings/firebase`} className="mt-6 block">
        <Card className="transition-transform duration-200 hover:-translate-y-0.5">
          <CardContent className="flex items-center gap-4 p-6">
            <span
              className={
                connected
                  ? "grid size-11 place-items-center rounded-2xl bg-green/15 text-[#2f8a51]"
                  : "grid size-11 place-items-center rounded-2xl bg-amber-100 text-amber-700"
              }
            >
              {connected ? (
                <CheckCircle2 className="size-6" />
              ) : (
                <ShieldAlert className="size-6" />
              )}
            </span>
            <div className="flex-1">
              <p className="font-bold text-ink">Firebase connection</p>
              <p className="text-sm text-muted">
                {connected
                  ? `Connected to ${ctx.tenant.firebase?.projectId}`
                  : "Not connected yet — required for courses, files, and assignments."}
              </p>
            </div>
            <ChevronRight className="size-5 text-muted" />
          </CardContent>
        </Card>
      </Link>

      <Link href={`/${ctx.tenant.slug}/settings/roles`} className="mt-4 block">
        <Card className="transition-transform duration-200 hover:-translate-y-0.5">
          <CardContent className="flex items-center gap-4 p-6">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="size-6" />
            </span>
            <div className="flex-1">
              <p className="font-bold text-ink">Roles &amp; permissions</p>
              <p className="text-sm text-muted">
                See exactly what Admins, Teachers, TAs, and Students can do.
              </p>
            </div>
            <ChevronRight className="size-5 text-muted" />
          </CardContent>
        </Card>
      </Link>

      <Link href={`/${ctx.tenant.slug}/settings/ai`} className="mt-4 block">
        <Card className="transition-transform duration-200 hover:-translate-y-0.5">
          <CardContent className="flex items-center gap-4 p-6">
            <span className="grid size-11 place-items-center rounded-2xl bg-purple/12 text-purple">
              <Sparkles className="size-6" />
            </span>
            <div className="flex-1">
              <p className="font-bold text-ink">AI Copilot</p>
              <p className="text-sm text-muted">
                Connect an AI key to enable quiz generation and feedback help.
              </p>
            </div>
            <ChevronRight className="size-5 text-muted" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { requireMembership } from "@/lib/tenant";
import { aiConfigStatus } from "@/lib/ai";
import { PageHeader } from "@/components/workspace/page-header";
import { AISettingsForm } from "@/components/workspace/ai-settings-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DEFAULT_MODEL = "claude-3-5-haiku-latest";

export default async function AISettingsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  const ctx = await requireMembership(workspace, ["OWNER"]);
  const status = await aiConfigStatus(ctx.tenant.id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/${workspace}/settings`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Settings
      </Link>

      <PageHeader
        title="AI Copilot"
        description="Use a tenant-owned provider key for quiz drafting and student hints."
        action={
          status ? (
            <Badge tone={status.enabled ? "green" : "neutral"}>
              {status.enabled ? "Enabled" : "Disabled"}
            </Badge>
          ) : (
            <Badge tone="yellow">Not configured</Badge>
          )
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-purple" />
            Provider key
          </CardTitle>
          <CardDescription>
            OpenPath encrypts the key with the same envelope encryption used for
            Firebase service accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AISettingsForm
            workspace={workspace}
            configured={Boolean(status)}
            initialEnabled={status?.enabled ?? true}
            initialModel={status?.model ?? DEFAULT_MODEL}
          />
        </CardContent>
      </Card>
    </div>
  );
}

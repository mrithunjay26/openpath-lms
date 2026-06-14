import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { requireMembership } from "@/lib/tenant";
import { PageHeader } from "@/components/workspace/page-header";
import { FirebaseForm } from "@/components/workspace/firebase-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function FirebaseSettingsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  const ctx = await requireMembership(workspace, ["OWNER"]);
  const fb = ctx.tenant.firebase;
  const connected = fb?.status === "ACTIVE";

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/${ctx.tenant.slug}/settings`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Back to settings
      </Link>

      <PageHeader
        title="Firebase connection"
        description="Bring your own Firebase project. Your data and files stay in your project — we only act on your behalf."
        action={
          connected ? (
            <Badge tone="green">
              <CheckCircle2 className="size-3.5" /> Connected
            </Badge>
          ) : (
            <Badge tone="yellow">
              <ShieldAlert className="size-3.5" /> Not connected
            </Badge>
          )
        }
      />

      {connected ? (
        <Card className="mb-6">
          <CardContent className="p-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Project ID
                </dt>
                <dd className="mt-1 font-mono text-sm text-ink">
                  {fb?.projectId}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Storage bucket
                </dt>
                <dd className="mt-1 font-mono text-sm text-ink">
                  {fb?.storageBucket || "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            {connected ? "Update credentials" : "Connect Firebase"}
          </CardTitle>
          <CardDescription>
            Create a service account in the Firebase console (Project settings →
            Service accounts → Generate new private key) and paste the JSON
            below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FirebaseForm slug={ctx.tenant.slug} storageBucket={fb?.storageBucket} />
        </CardContent>
      </Card>
    </div>
  );
}

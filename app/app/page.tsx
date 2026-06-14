import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Plus, School, ShieldAlert } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/session";
import { listUserTenants, canCreateWorkspace } from "@/lib/tenant";
import { initials } from "@/lib/utils";
import { roleLabel } from "@/lib/permissions";
import { readTheme } from "@/lib/theme";

export const metadata: Metadata = { title: "Your workspaces" };

export default async function AppHomePage() {
  const user = await requireUser("/app");
  const memberships = await listUserTenants(user.id);
  const canCreate = await canCreateWorkspace(user.id, user.platformRole);

  return (
    <Container className="max-w-5xl py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Your workspaces
          </h1>
          <p className="mt-1.5 text-muted">
            Open a workspace, or join one your educator or program lead already set up.
          </p>
        </div>
        {canCreate ? (
          <Link href="/onboarding" className={buttonVariants()}>
            <Plus className="size-4" />
            New workspace
          </Link>
        ) : (
          <Link href="/join" className={buttonVariants({ variant: "accent" })}>
            Join with code
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>

      {memberships.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={School}
          title="No workspaces yet"
          description={
            canCreate
              ? "Create your first workspace. It takes about a minute - name it, connect Firebase, and you're live."
              : "Join a workspace with a code from your teacher, club leader, or program organizer."
          }
          action={
            canCreate ? (
              <Link href="/onboarding" className={buttonVariants({ variant: "accent" })}>
                Create your workspace
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <Link href="/join" className={buttonVariants({ variant: "accent" })}>
                Join with a code
                <ArrowRight className="size-4" />
              </Link>
            )
          }
        />
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map((m) => {
            const theme = readTheme(m.tenant.theme);
            const connected = m.tenant.firebase?.status === "ACTIVE";
            return (
              <Link key={m.tenant.id} href={`/${m.tenant.slug}`} className="group">
                <Card className="h-full p-6 transition-transform duration-200 group-hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className="grid size-12 place-items-center rounded-2xl text-base font-extrabold text-white"
                      style={{ background: theme.primary }}
                    >
                      {m.tenant.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.tenant.logoUrl}
                          alt=""
                          className="size-full rounded-2xl object-cover"
                        />
                      ) : (
                        initials(m.tenant.name)
                      )}
                    </span>
                    <Badge tone={m.role === "STUDENT" ? "neutral" : "primary"}>
                      {roleLabel(m.role)}
                    </Badge>
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-ink">
                    {m.tenant.name}
                  </h2>
                  <p className="text-sm text-muted">/{m.tenant.slug}</p>
                  {!connected && m.role === "OWNER" ? (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                      <ShieldAlert className="size-3.5" />
                      Connect Firebase to finish setup
                    </p>
                  ) : null}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}

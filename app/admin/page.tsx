import Link from "next/link";
import { redirect } from "next/navigation";
import { Palette, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/workspace/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { readTheme } from "@/lib/theme";
import { formatDateTime, initials } from "@/lib/utils";

export default async function AdminPage() {
  const user = await requireUser("/admin");
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { platformRole: true },
  });
  if (dbUser?.platformRole !== "STUIMPACT_ADMIN") redirect("/app");

  const [tenantCount, userCount, activeFirebase, recentTenants, audits] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.firebaseCredential.count({ where: { status: "ACTIVE" } }),
      prisma.tenant.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          firebase: { select: { status: true, projectId: true } },
          memberships: { select: { id: true } },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          tenant: { select: { name: true, slug: true, theme: true } },
          actor: { select: { email: true } },
        },
      }),
    ]);

  return (
    <main className="min-h-dvh bg-background px-5 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <PageHeader
          eyebrow="Platform console"
          title="StuImpact admin"
          description="Watch workspace health, inspect recent activity, and jump straight into design or Firebase setup when a workspace needs attention."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Metric
            label="Workspaces"
            value={tenantCount}
            icon={WandSparkles}
            tone="primary"
          />
          <Metric
            label="Users"
            value={userCount}
            icon={Sparkles}
            tone="teal"
          />
          <Metric
            label="Firebase connected"
            value={activeFirebase}
            icon={ShieldCheck}
            tone="green"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Palette className="size-5 text-primary" />
                Workspace design studio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted">
                Every workspace can use its own colors, corner radius, background
                intensity, density, and canvas width. Open a workspace to tune its
                visual identity.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {recentTenants.map((tenant) => {
                  const theme = readTheme(tenant.theme);
                  return (
                    <Link key={tenant.id} href={`/${tenant.slug}/settings`} className="group">
                      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4 transition-transform duration-200 group-hover:-translate-y-0.5">
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className="grid size-12 place-items-center rounded-2xl text-sm font-extrabold text-white shadow-[var(--shadow-glow)]"
                            style={{ background: theme.primary }}
                          >
                            {tenant.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={tenant.logoUrl}
                                alt=""
                                className="size-full rounded-2xl object-cover"
                              />
                            ) : (
                              initials(tenant.name)
                            )}
                          </span>
                          <Badge tone={tenant.firebase?.status === "ACTIVE" ? "green" : "yellow"}>
                            {tenant.firebase?.status ?? "No Firebase"}
                          </Badge>
                        </div>
                        <h3 className="mt-4 font-bold text-ink">{tenant.name}</h3>
                        <p className="text-sm text-muted">/{tenant.slug}</p>
                        <p className="mt-1 text-xs text-muted">
                          {tenant.memberships.length} members
                        </p>
                        <div className="mt-4 flex items-center gap-2">
                          <span
                            className="size-3 rounded-full"
                            style={{ background: theme.primary }}
                          />
                          <span
                            className="size-3 rounded-full"
                            style={{ background: theme.accent }}
                          />
                          <span
                            className="size-3 rounded-full"
                            style={{ background: theme.accent2 }}
                          />
                          <span className="ml-auto text-xs font-semibold uppercase tracking-wide text-muted">
                            {theme.density} / {theme.shellWidth}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Recent audit events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {audits.map((audit) => (
                <div key={audit.id} className="rounded-2xl bg-background/60 p-3 text-sm">
                  <p className="font-semibold text-ink">{audit.action}</p>
                  <p className="text-xs text-muted">
                    {audit.tenant?.name ?? "Platform"} · {audit.actor?.email ?? "system"} ·{" "}
                    {formatDateTime(audit.createdAt.toISOString())}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tone: "primary" | "teal" | "green";
}) {
  const toneClass = {
    primary: "bg-primary/12 text-primary",
    teal: "bg-teal/15 text-teal",
    green: "bg-green/15 text-green",
  }[tone];

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 pt-[var(--workspace-card-padding)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-ink">{value}</p>
        </div>
        <span className={`grid size-12 place-items-center rounded-2xl ${toneClass}`}>
          <Icon className="size-6" />
        </span>
      </CardContent>
    </Card>
  );
}

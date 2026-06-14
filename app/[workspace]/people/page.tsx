import { UserMinus } from "lucide-react";
import type { MembershipRole } from "@prisma/client";
import { requireMembership } from "@/lib/tenant";
import { roleLabel } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { listCourses, type Course } from "@/lib/firebase-data";
import { removeMemberAction } from "@/lib/actions/people";
import { PageHeader } from "@/components/workspace/page-header";
import { InvitePanel, JoinCodePanel } from "@/components/workspace/people-panels";
import { GuardianPanel } from "@/components/workspace/guardian-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

const roleTone: Record<MembershipRole, "purple" | "primary" | "teal" | "neutral"> =
  {
    OWNER: "purple",
    TEACHER: "primary",
    TA: "teal",
    STUDENT: "neutral",
  };

export default async function PeoplePage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  const ctx = await requireMembership(workspace, ["OWNER", "TEACHER"]);
  const isOwner = ctx.role === "OWNER";
  const connected = ctx.tenant.firebase?.status === "ACTIVE";

  const [memberships, invites, joinCodes, guardians] = await Promise.all([
    prisma.membership.findMany({
      where: { tenantId: ctx.tenant.id },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invitation.findMany({
      where: { tenantId: ctx.tenant.id, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    }),
    prisma.joinCode.findMany({
      where: { tenantId: ctx.tenant.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.guardianContact.findMany({
      where: { tenantId: ctx.tenant.id },
      include: { student: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  let courses: Course[] = [];
  if (connected) {
    try {
      courses = await listCourses(ctx.tenant.id);
    } catch {
      courses = [];
    }
  }
  const courseName = (id: string | null) =>
    id ? courses.find((c) => c.id === id)?.name ?? "Course" : "Workspace";

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="People"
        description="Manage who's in your workspace and how they join."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle>Members ({memberships.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {memberships.map((m) => {
              const removable =
                isOwner && m.role !== "OWNER" && m.userId !== ctx.user.id;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-cream/40"
                >
                  <Avatar
                    name={m.user.name}
                    email={m.user.email}
                    src={m.user.image}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {m.user.name || m.user.email}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {m.user.email}
                    </p>
                  </div>
                  <Badge tone={roleTone[m.role]}>{roleLabel(m.role)}</Badge>
                  {removable ? (
                    <form action={removeMemberAction.bind(null, workspace, m.id)}>
                      <button
                        type="submit"
                        className="grid size-8 place-items-center rounded-lg text-muted hover:bg-rose-50 hover:text-rose-600"
                        title="Remove member"
                      >
                        <UserMinus className="size-4" />
                      </button>
                    </form>
                  ) : null}
                </div>
              );
            })}

            {invites.length > 0 ? (
              <div className="mt-4 border-t border-line pt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
                  Pending invites
                </p>
                {invites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between px-2 py-1.5 text-sm"
                  >
                    <span className="text-muted">{inv.email}</span>
                    <Badge tone="yellow">{roleLabel(inv.role)}</Badge>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Add people */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add a member</CardTitle>
            </CardHeader>
            <CardContent>
              <InvitePanel slug={workspace} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Join codes</CardTitle>
            </CardHeader>
            <CardContent>
              <JoinCodePanel
                slug={workspace}
                courses={courses.map((c) => ({ id: c.id, name: c.name }))}
              />
              {joinCodes.length > 0 ? (
                <ul className="mt-4 space-y-2 border-t border-line pt-4">
                  {joinCodes.map((jc) => (
                    <li
                      key={jc.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <code className="rounded-lg bg-cream px-2 py-1 font-mono font-bold text-ink">
                        {jc.code}
                      </code>
                      <span className="text-xs text-muted">
                        {courseName(jc.courseId)} · {jc.uses} joined
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-3 text-xs text-muted">
                Students join at{" "}
                <span className="font-semibold text-ink">/join</span> with a code.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guardian access</CardTitle>
            </CardHeader>
            <CardContent>
              <GuardianPanel
                slug={workspace}
                students={memberships
                  .filter((m) => m.role === "STUDENT")
                  .map((m) => ({
                    membershipId: m.id,
                    name: m.user.name ?? "",
                    email: m.user.email ?? "",
                  }))}
              />
              {guardians.length > 0 ? (
                <ul className="mt-4 space-y-2 border-t border-line pt-4">
                  {guardians.map((g) => (
                    <li key={g.id} className="text-sm">
                      <p className="font-semibold text-ink">{g.name}</p>
                      <p className="text-xs text-muted">
                        {g.email} · {g.student.name || g.student.email}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

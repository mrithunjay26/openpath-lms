import Link from "next/link";
import { ArrowLeft, Check, Minus } from "lucide-react";
import { requireMembership } from "@/lib/tenant";
import {
  can,
  roleLabel,
  CAPABILITY_ROWS,
  MATRIX_ROLES,
  ROLE_SUMMARY,
} from "@/lib/permissions";
import { PageHeader } from "@/components/workspace/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function RolesPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  await requireMembership(workspace, ["OWNER"]);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/${workspace}/settings`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Back to settings
      </Link>

      <PageHeader
        title="Roles & permissions"
        description="OpenPath has four clear tiers. Here's exactly what each can do."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {MATRIX_ROLES.map((role) => (
          <Card key={role}>
            <CardContent className="p-5">
              <p className="font-bold text-ink">{roleLabel(role)}</p>
              <p className="mt-1 text-sm text-muted">{ROLE_SUMMARY[role]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-5 py-3 text-left font-semibold text-muted">
                  Capability
                </th>
                {MATRIX_ROLES.map((role) => (
                  <th
                    key={role}
                    className="px-3 py-3 text-center font-semibold text-ink"
                  >
                    {roleLabel(role)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAPABILITY_ROWS.map((row) => (
                <tr key={row.key} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-ink">{row.label}</p>
                    <p className="text-xs text-muted">{row.help}</p>
                  </td>
                  {MATRIX_ROLES.map((role) => (
                    <td key={role} className="px-3 py-3 text-center">
                      {can(role, row.key) ? (
                        <Check className="mx-auto size-4 text-green" />
                      ) : (
                        <Minus className="mx-auto size-4 text-muted/40" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

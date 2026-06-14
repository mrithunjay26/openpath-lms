import { prisma } from "@/lib/prisma";

/**
 * Best-effort audit trail. Records security-relevant actions (especially
 * Firebase credential changes/access). Never throws — auditing must not break
 * the request it is observing.
 */
export async function writeAudit(params: {
  action: string;
  tenantId?: string | null;
  actorId?: string | null;
  meta?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        tenantId: params.tenantId ?? null,
        actorId: params.actorId ?? null,
        meta: (params.meta ?? undefined) as object | undefined,
      },
    });
  } catch {
    // swallow — auditing is non-critical
  }
}

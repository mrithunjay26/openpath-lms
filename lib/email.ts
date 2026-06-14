import "server-only";
import { prisma } from "@/lib/prisma";

export type EmailResult = { sent: number; skipped: boolean; reason?: string };

async function sendEmail(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "OpenPath <notifications@openpath.local>";
  if (!apiKey) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text }),
  });
  return res.ok;
}

export async function notifyWorkspaceMembers(opts: {
  tenantId: string;
  audience: "all" | "students" | "staff";
  subject: string;
  text: string;
}): Promise<EmailResult> {
  if (process.env.OPENPATH_EMAIL_NOTIFICATIONS !== "on") {
    return { sent: 0, skipped: true, reason: "Email notifications are off." };
  }

  const memberships = await prisma.membership.findMany({
    where: {
      tenantId: opts.tenantId,
      status: "ACTIVE",
      ...(opts.audience === "students"
        ? { role: "STUDENT" as const }
        : opts.audience === "staff"
          ? { role: { in: ["OWNER", "TEACHER", "TA"] as const } }
          : {}),
    },
    include: { user: { select: { email: true } } },
  });

  let sent = 0;
  for (const m of memberships) {
    if (!m.user.email) continue;
    if (await sendEmail(m.user.email, opts.subject, opts.text)) sent++;
  }
  return { sent, skipped: false };
}

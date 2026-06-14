import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { can } from "@/lib/permissions";
import { buildImpactReport, impactReportLines } from "@/lib/reporting";
import { simpleTextPdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspace: string }> },
) {
  const { workspace } = await params;
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug: workspace } });
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
  });
  if (!membership || !can(membership.role, "people.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const report = await buildImpactReport(tenant.id);
  const pdf = simpleTextPdf(
    `${report.tenantName} impact report`,
    impactReportLines(report),
  );
  return new NextResponse(pdf, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="impact-${workspace}.pdf"`,
    },
  });
}

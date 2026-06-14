import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isStaff } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { computeGradebook, gradebookToCsv } from "@/lib/gradebook";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspace: string; courseId: string }> },
) {
  const { workspace, courseId } = await params;

  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: workspace },
    include: { firebase: { select: { status: true } } },
  });
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
  });
  if (!membership || !isStaff(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (tenant.firebase?.status !== "ACTIVE") {
    return NextResponse.json({ error: "Not connected" }, { status: 400 });
  }

  const gb = await computeGradebook(tenant.id, courseId);
  const csv = gradebookToCsv(gb);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gradebook-${courseId}.csv"`,
    },
  });
}

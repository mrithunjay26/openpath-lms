import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getDownloadUrl } from "@/lib/firebase-files";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspace: string }> },
) {
  const { workspace } = await params;
  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: workspace },
    include: { firebase: { select: { status: true } } },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!canDownloadPath(path, user.id, membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (tenant.firebase?.status !== "ACTIVE") {
    return NextResponse.json({ error: "Firebase not connected" }, { status: 400 });
  }

  try {
    const url = await getDownloadUrl(tenant.id, path);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}

function canDownloadPath(
  path: string,
  userId: string,
  role: "OWNER" | "TEACHER" | "TA" | "STUDENT",
) {
  const clean = path.replace(/\\/g, "/");
  if (can(role, "files.manage")) return true;
  const parts = clean.split("/");
  return parts[0] === "submissions" && parts[3] === userId;
}

import { Suspense } from "react";
import { requireMembership, can } from "@/lib/tenant";
import { listFiles } from "@/lib/firebase-files";
import { PageHeader } from "@/components/workspace/page-header";
import { NotConnected } from "@/components/workspace/not-connected";
import { FileManager } from "@/components/workspace/file-manager";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default async function FilesPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ path?: string }>;
}) {
  const { workspace } = await params;
  const { path = "" } = await searchParams;
  const ctx = await requireMembership(workspace);
  const canManage = can(ctx.role, "files.manage");
  const fb = ctx.tenant.firebase;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Files"
        description="Resources and shared materials, stored in your Firebase."
      />

      {fb?.status !== "ACTIVE" ? (
        <NotConnected slug={workspace} isOwner={ctx.role === "OWNER"} />
      ) : !fb.storageBucket ? (
        <Alert tone="warning">
          Add a Storage bucket in workspace settings to use the file manager.
        </Alert>
      ) : (
        <Suspense
          key={path}
          fallback={
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-64" />
            </div>
          }
        >
          <FilesBody
            workspace={workspace}
            tenantId={ctx.tenant.id}
            path={path}
            canManage={canManage}
          />
        </Suspense>
      )}
    </div>
  );
}

async function FilesBody({
  workspace,
  tenantId,
  path,
  canManage,
}: {
  workspace: string;
  tenantId: string;
  path: string;
  canManage: boolean;
}) {
  let folders: string[] = [];
  let files: Awaited<ReturnType<typeof listFiles>>["files"] = [];
  let loadError: string | null = null;
  try {
    const listing = await listFiles(tenantId, path);
    folders = listing.folders;
    files = listing.files;
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load files.";
  }

  if (loadError) return <Alert tone="error">{loadError}</Alert>;

  return (
    <FileManager
      slug={workspace}
      path={path}
      folders={folders}
      files={files}
      canManage={canManage}
    />
  );
}

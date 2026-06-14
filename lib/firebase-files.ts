import "server-only";
import { bucketForTenant } from "@/lib/firebase-admin";

/**
 * Tenant file storage (each tenant's own Firebase Storage bucket).
 * Ports the Flask file-manager routes: list, upload, folders, delete, rename,
 * and signed-URL downloads. Folders are represented by a `.folderMarker`
 * object so empty folders persist.
 */

export type StoredFile = {
  name: string;
  path: string;
  size: number;
  updated: string | null;
  contentType: string;
};

export type FileListing = {
  folders: string[];
  files: StoredFile[];
};

const MARKER = ".folderMarker";

function normalizePrefix(path: string): string {
  if (!path) return "";
  return path.endsWith("/") ? path : `${path}/`;
}

export async function listFiles(
  tenantId: string,
  path = "",
): Promise<FileListing> {
  const bucket = await bucketForTenant(tenantId);
  const prefix = normalizePrefix(path);

  const [files, , apiResponse] = await bucket.getFiles({
    prefix,
    delimiter: "/",
    autoPaginate: false,
  });

  const prefixes =
    (apiResponse as { prefixes?: string[] } | undefined)?.prefixes ?? [];
  const folders = prefixes
    .map((p) => p.slice(prefix.length).replace(/\/$/, ""))
    .filter(Boolean);

  const list: StoredFile[] = files
    .filter((f) => f.name !== prefix && !f.name.endsWith(MARKER))
    .map((f) => ({
      name: f.name.slice(prefix.length),
      path: f.name,
      size: Number(f.metadata?.size ?? 0),
      updated: f.metadata?.updated ? String(f.metadata.updated) : null,
      contentType: String(f.metadata?.contentType ?? ""),
    }))
    .filter((f) => f.name.length > 0);

  return { folders, files: list };
}

export async function uploadFile(
  tenantId: string,
  path: string,
  file: File,
): Promise<void> {
  const bucket = await bucketForTenant(tenantId);
  const prefix = normalizePrefix(path);
  const buffer = Buffer.from(await file.arrayBuffer());
  await bucket.file(`${prefix}${file.name}`).save(buffer, {
    contentType: file.type || "application/octet-stream",
    resumable: false,
  });
}

export async function createFolder(
  tenantId: string,
  path: string,
  folderName: string,
): Promise<void> {
  const bucket = await bucketForTenant(tenantId);
  const prefix = normalizePrefix(path);
  const safe = folderName.replace(/[/]/g, "").trim();
  if (!safe) throw new Error("Invalid folder name.");
  await bucket.file(`${prefix}${safe}/${MARKER}`).save("", {
    contentType: "text/plain",
    resumable: false,
  });
}

export async function deleteFile(
  tenantId: string,
  filePath: string,
): Promise<void> {
  const bucket = await bucketForTenant(tenantId);
  await bucket.file(filePath).delete({ ignoreNotFound: true });
}

export async function deleteFolder(
  tenantId: string,
  folderPath: string,
): Promise<void> {
  const bucket = await bucketForTenant(tenantId);
  const prefix = normalizePrefix(folderPath);
  const [files] = await bucket.getFiles({ prefix });
  await Promise.all(files.map((f) => f.delete({ ignoreNotFound: true })));
}

export async function renameFile(
  tenantId: string,
  filePath: string,
  newName: string,
): Promise<void> {
  const bucket = await bucketForTenant(tenantId);
  const safe = newName.replace(/[/]/g, "").trim();
  if (!safe) throw new Error("Invalid file name.");
  const dir = filePath.includes("/")
    ? filePath.slice(0, filePath.lastIndexOf("/") + 1)
    : "";
  const dest = `${dir}${safe}`;
  await bucket.file(filePath).copy(bucket.file(dest));
  await bucket.file(filePath).delete({ ignoreNotFound: true });
}

export async function getDownloadUrl(
  tenantId: string,
  filePath: string,
): Promise<string> {
  const bucket = await bucketForTenant(tenantId);
  const [url] = await bucket.file(filePath).getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });
  return url;
}

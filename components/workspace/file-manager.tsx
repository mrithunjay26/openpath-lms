"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download,
  FileText,
  Folder,
  FolderPlus,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import {
  createFolderAction,
  deleteEntryAction,
  renameFileAction,
  uploadFilesAction,
  type FormState,
} from "@/lib/actions/files";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { Card } from "@/components/ui/card";

type FileItem = {
  name: string;
  path: string;
  size: number;
  updated: string | null;
  contentType: string;
};

function formatBytes(n: number) {
  if (!n) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function FileManager({
  slug,
  path,
  folders,
  files,
  canManage,
}: {
  slug: string;
  path: string;
  folders: string[];
  files: FileItem[];
  canManage: boolean;
}) {
  const router = useRouter();
  const prefix = path ? (path.endsWith("/") ? path : `${path}/`) : "";
  const segments = path.split("/").filter(Boolean);

  const [upState, upAction, upPending] = useActionState<FormState, FormData>(
    uploadFilesAction.bind(null, slug),
    undefined,
  );
  const [nfState, nfAction, nfPending] = useActionState<FormState, FormData>(
    createFolderAction.bind(null, slug),
    undefined,
  );
  const [rnState, rnAction, rnPending] = useActionState<FormState, FormData>(
    renameFileAction.bind(null, slug),
    undefined,
  );
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);

  useEffect(() => {
    if (upState?.ok || nfState?.ok) router.refresh();
  }, [upState, nfState, router]);

  useEffect(() => {
    if (rnState?.ok) {
      setRenameTarget(null);
      router.refresh();
    }
  }, [rnState, router]);

  const filesHref = (p: string) =>
    p ? `/${slug}/files?path=${encodeURIComponent(p)}` : `/${slug}/files`;
  const downloadHref = (p: string) =>
    `/api/${slug}/files/download?path=${encodeURIComponent(p)}`;

  return (
    <div className="space-y-5">
      {/* breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-sm">
        <Link
          href={filesHref("")}
          className="font-semibold text-ink hover:text-primary"
        >
          Files
        </Link>
        {segments.map((seg, i) => {
          const upto = segments.slice(0, i + 1).join("/");
          return (
            <span key={upto} className="flex items-center gap-1">
              <span className="text-muted">/</span>
              <Link
                href={filesHref(upto)}
                className="font-semibold text-ink hover:text-primary"
              >
                {seg}
              </Link>
            </span>
          );
        })}
      </nav>

      {/* manage bar */}
      {canManage ? (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <form action={upAction} className="flex items-center gap-2">
              <input type="hidden" name="path" value={path} />
              <input
                type="file"
                name="file"
                multiple
                required
                className="block max-w-56 text-sm text-muted file:mr-2 file:rounded-pill file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-ink hover:file:opacity-90"
              />
              <Button type="submit" size="sm" disabled={upPending}>
                <Upload className="size-4" />
                {upPending ? "Uploading…" : "Upload"}
              </Button>
            </form>
            <div className="h-6 w-px bg-line" />
            <form action={nfAction} className="flex items-center gap-2">
              <input type="hidden" name="path" value={path} />
              <Input
                name="folderName"
                placeholder="New folder"
                className="h-9 w-40 text-sm"
              />
              <Button type="submit" size="sm" variant="outline" disabled={nfPending}>
                <FolderPlus className="size-4" />
                Add
              </Button>
            </form>
          </div>
          {upState?.error ? (
            <Alert tone="error" className="mt-3">
              {upState.error}
            </Alert>
          ) : null}
          {nfState?.error ? (
            <Alert tone="error" className="mt-3">
              {nfState.error}
            </Alert>
          ) : null}
        </Card>
      ) : null}

      {/* listing */}
      {folders.length === 0 && files.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-12 text-center text-sm text-muted">
          This folder is empty.
        </p>
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {folders.map((folder) => (
            <Link
              key={folder}
              href={filesHref(prefix + folder)}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-cream/50"
            >
              <Folder className="size-5 text-yellow" />
              <span className="flex-1 font-semibold text-ink">{folder}</span>
            </Link>
          ))}

          {files.map((file) => (
            <div
              key={file.path}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-cream/40"
            >
              <FileText className="size-5 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-ink">
                  {file.name}
                </span>
                <span className="text-xs text-muted">
                  {formatBytes(file.size)}
                </span>
              </span>
              <a
                href={downloadHref(file.path)}
                className="grid size-9 place-items-center rounded-xl text-muted hover:bg-ink/5 hover:text-ink"
                title="Download"
              >
                <Download className="size-4" />
              </a>
              {canManage ? (
                <>
                  <button
                    type="button"
                    onClick={() => setRenameTarget(file)}
                    className="grid size-9 place-items-center rounded-xl text-muted hover:bg-ink/5 hover:text-ink"
                    title="Rename"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <form action={deleteEntryAction.bind(null, slug)}>
                    <input type="hidden" name="target" value={file.path} />
                    <input type="hidden" name="kind" value="file" />
                    <button
                      type="submit"
                      onClick={(e) => {
                        if (!confirm(`Delete "${file.name}"?`))
                          e.preventDefault();
                      }}
                      className="grid size-9 place-items-center rounded-xl text-muted hover:bg-rose-50 hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                </>
              ) : null}
            </div>
          ))}
        </Card>
      )}

      <Modal
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title="Rename file"
      >
        <form action={rnAction} className="space-y-3">
          <input type="hidden" name="filePath" value={renameTarget?.path ?? ""} />
          <Input
            key={renameTarget?.path}
            name="newName"
            defaultValue={renameTarget?.name}
            required
          />
          {rnState?.error ? <Alert tone="error">{rnState.error}</Alert> : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRenameTarget(null)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={rnPending}>
              {rnPending ? "Renaming…" : "Rename"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/tenant";
import {
  createFolder,
  deleteFile,
  deleteFolder,
  renameFile,
  uploadFile,
} from "@/lib/firebase-files";

export type FormState = { error?: string; ok?: boolean } | undefined;

async function loadFileManager(slug: string) {
  const user = await requireUser();
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { firebase: { select: { status: true, storageBucket: true } } },
  });
  if (!tenant) return { error: "Workspace not found." as const };
  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
  });
  if (!membership || !can(membership.role, "files.manage")) {
    return { error: "You don't have permission to manage files." as const };
  }
  if (tenant.firebase?.status !== "ACTIVE" || !tenant.firebase.storageBucket) {
    return {
      error: "Connect a Firebase Storage bucket for this workspace first." as const,
    };
  }
  return { tenant };
}

export async function uploadFilesAction(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadFileManager(slug);
  if ("error" in ctx) return { error: ctx.error };

  const path = String(formData.get("path") || "");
  const files = formData.getAll("file").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "Choose at least one file." };

  try {
    for (const file of files) {
      await uploadFile(ctx.tenant.id, path, file);
    }
  } catch (e) {
    return { error: fbError(e) };
  }
  revalidatePath(`/${slug}/files`);
  return { ok: true };
}

export async function createFolderAction(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadFileManager(slug);
  if ("error" in ctx) return { error: ctx.error };

  const path = String(formData.get("path") || "");
  const folderName = String(formData.get("folderName") || "").trim();
  if (!folderName) return { error: "Enter a folder name." };

  try {
    await createFolder(ctx.tenant.id, path, folderName);
  } catch (e) {
    return { error: fbError(e) };
  }
  revalidatePath(`/${slug}/files`);
  return { ok: true };
}

export async function deleteEntryAction(
  slug: string,
  formData: FormData,
): Promise<void> {
  const ctx = await loadFileManager(slug);
  if ("error" in ctx) return;

  const target = String(formData.get("target") || "");
  const kind = String(formData.get("kind") || "file");
  if (!target) return;

  try {
    if (kind === "folder") {
      await deleteFolder(ctx.tenant.id, target);
    } else {
      await deleteFile(ctx.tenant.id, target);
    }
  } catch {
    // ignore — revalidate will reflect the real state
  }
  revalidatePath(`/${slug}/files`);
}

export async function renameFileAction(
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await loadFileManager(slug);
  if ("error" in ctx) return { error: ctx.error };

  const filePath = String(formData.get("filePath") || "");
  const newName = String(formData.get("newName") || "").trim();
  if (!filePath || !newName) return { error: "Enter a new name." };

  try {
    await renameFile(ctx.tenant.id, filePath, newName);
  } catch (e) {
    return { error: fbError(e) };
  }
  revalidatePath(`/${slug}/files`);
  return { ok: true };
}

function fbError(e: unknown): string {
  const msg = e instanceof Error ? e.message : "Something went wrong.";
  return `Storage error: ${msg}`;
}

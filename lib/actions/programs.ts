"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/tenant";
import {
  addModuleItem,
  coursesTag,
  createAssignment,
  createCourse,
  createModule,
  enrollUser,
} from "@/lib/firebase-data";
import { getProgramTemplate } from "@/lib/program-templates";

async function loadAuthor(slug: string) {
  const user = await requireUser();
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { firebase: { select: { status: true } } },
  });
  if (!tenant) return { error: "Workspace not found." as const };
  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
  });
  if (!membership || !can(membership.role, "course.create")) {
    return { error: "You don't have permission to create programs." as const };
  }
  if (tenant.firebase?.status !== "ACTIVE") {
    return { error: "Connect Firebase before creating programs." as const };
  }
  return { user, tenant };
}

export async function createProgramFromTemplateAction(
  slug: string,
  templateId: string,
) {
  const ctx = await loadAuthor(slug);
  if ("error" in ctx) return;
  const template = getProgramTemplate(templateId);
  if (!template) return;

  const courseId = await createCourse(ctx.tenant.id, {
    name: template.name,
    description: template.description,
    term: template.term,
    skills: template.skills,
  });
  await enrollUser(ctx.tenant.id, courseId, {
    userId: ctx.user.id,
    name: ctx.user.name ?? "",
    email: ctx.user.email ?? "",
    role: "TEACHER",
  });
  for (const mod of template.modules) {
    const moduleId = await createModule(ctx.tenant.id, courseId, mod.title);
    for (const lesson of mod.lessons) {
      await addModuleItem(ctx.tenant.id, courseId, moduleId, {
        type: "lesson",
        title: lesson.title,
        content: lesson.content,
      });
    }
  }
  for (const assignment of template.assignments) {
    await createAssignment(ctx.tenant.id, courseId, assignment);
  }

  revalidateTag(coursesTag(ctx.tenant.id));
  revalidatePath(`/${slug}/courses`);
  redirect(`/${slug}/courses/${courseId}/modules`);
}

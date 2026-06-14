import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Layers,
  Link2,
} from "lucide-react";
import { can, isStaff, requireMembership } from "@/lib/tenant";
import { getCourse, listModules, type ModuleItem } from "@/lib/firebase-data";
import { createModuleAction, addModuleItemAction } from "@/lib/actions/lms";
import { CourseTabs } from "@/components/workspace/course-tabs";
import { NotConnected } from "@/components/workspace/not-connected";
import { ModalForm } from "@/components/workspace/modal-form";
import { LessonOutlineGenerator } from "@/components/workspace/lesson-outline-generator";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

export default async function ModulesPage({
  params,
}: {
  params: Promise<{ workspace: string; courseId: string }>;
}) {
  const { workspace, courseId } = await params;
  const ctx = await requireMembership(workspace);
  const staff = isStaff(ctx.role);
  const author = can(ctx.role, "content.author");

  if (ctx.tenant.firebase?.status !== "ACTIVE") {
    return (
      <div className="mx-auto max-w-4xl">
        <NotConnected slug={workspace} isOwner={ctx.role === "OWNER"} />
      </div>
    );
  }

  const course = await getCourse(ctx.tenant.id, courseId);
  if (!course) notFound();
  const modules = await listModules(ctx.tenant.id, courseId);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/${workspace}/courses/${courseId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> {course.name}
      </Link>
      <CourseTabs workspace={workspace} courseId={courseId} staff={staff} />

      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Modules</h1>
        {author ? (
          <ModalForm
            triggerLabel="Add module"
            triggerIcon="plus"
            title="New module"
            submitLabel="Add module"
            action={createModuleAction.bind(null, workspace, courseId)}
          >
            <div>
              <Label htmlFor="m-title">Module title</Label>
              <Input id="m-title" name="title" placeholder="Week 1 — Foundations" required />
            </div>
          </ModalForm>
        ) : null}
      </div>

      {author && modules.length > 0 ? (
        <div className="mb-5">
          <LessonOutlineGenerator
            workspace={workspace}
            courseId={courseId}
            modules={modules}
          />
        </div>
      ) : null}

      {modules.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No modules yet"
          description={
            author
              ? "Organize your course into modules of lessons and resources."
              : "Your teacher hasn't added modules yet."
          }
        />
      ) : (
        <div className="space-y-5">
          {modules.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-bold text-ink">
                    <Layers className="size-4 text-primary" />
                    {m.title}
                  </h2>
                  {author ? (
                    <ModalForm
                      triggerLabel="Add item"
                      triggerIcon="plus"
                      triggerVariant="ghost"
                      title={`Add to "${m.title}"`}
                      submitLabel="Add item"
                      action={addModuleItemAction.bind(
                        null,
                        workspace,
                        courseId,
                        m.id,
                      )}
                    >
                      <div>
                        <Label htmlFor={`type-${m.id}`}>Type</Label>
                        <Select id={`type-${m.id}`} name="type" defaultValue="lesson">
                          <option value="lesson">Lesson (text)</option>
                          <option value="link">Link</option>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`it-${m.id}`}>Title</Label>
                        <Input id={`it-${m.id}`} name="title" required />
                      </div>
                      <div>
                        <Label htmlFor={`ic-${m.id}`}>Lesson content</Label>
                        <Textarea
                          id={`ic-${m.id}`}
                          name="content"
                          placeholder="Write the lesson, or leave blank for a link"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`iu-${m.id}`}>URL (for links)</Label>
                        <Input id={`iu-${m.id}`} name="url" type="url" placeholder="https://…" />
                      </div>
                    </ModalForm>
                  ) : null}
                </div>

                {m.items.length === 0 ? (
                  <p className="text-sm text-muted">No items yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {m.items.map((item) => (
                      <ModuleItemRow key={item.id} item={item} />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleItemRow({ item }: { item: ModuleItem }) {
  if (item.type === "link" || (item.type === "file" && item.url)) {
    return (
      <li>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-line bg-background/50 px-4 py-3 hover:bg-cream/50"
        >
          <Link2 className="size-4 text-teal" />
          <span className="flex-1 text-sm font-semibold text-ink">
            {item.title}
          </span>
          <ExternalLink className="size-4 text-muted" />
        </a>
      </li>
    );
  }
  return (
    <li className="rounded-2xl border border-line bg-background/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <FileText className="size-4 text-primary" />
        <span className="text-sm font-semibold text-ink">{item.title}</span>
      </div>
      {item.content ? (
        <p className="mt-2 whitespace-pre-wrap pl-7 text-sm text-muted">
          {item.content}
        </p>
      ) : null}
    </li>
  );
}

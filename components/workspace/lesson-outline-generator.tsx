"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import {
  generateLessonOutlineAction,
  type LessonDraftState,
} from "@/lib/actions/ai";
import {
  addLessonFromDraftAction,
  type FormState,
} from "@/lib/actions/lms";
import type { CourseModule } from "@/lib/firebase-data";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function LessonOutlineGenerator({
  workspace,
  courseId,
  modules,
}: {
  workspace: string;
  courseId: string;
  modules: CourseModule[];
}) {
  const draftAction = generateLessonOutlineAction.bind(null, workspace, courseId);
  const saveAction = addLessonFromDraftAction.bind(null, workspace, courseId);
  const [draftState, draftFormAction, drafting] = useActionState<
    LessonDraftState,
    FormData
  >(draftAction, undefined);
  const [saveState, saveFormAction, saving] = useActionState<
    FormState,
    FormData
  >(saveAction, undefined);
  const router = useRouter();

  useEffect(() => {
    if (saveState?.ok) router.refresh();
  }, [saveState, router]);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-2xl bg-purple/12 text-purple">
            <Sparkles className="size-4.5" />
          </span>
          <h2 className="font-bold text-ink">Lesson outline</h2>
        </div>

        <form
          action={draftFormAction}
          className="grid gap-3 md:grid-cols-[1fr_110px_1fr_auto]"
        >
          <div>
            <Label htmlFor="lesson-topic">Topic</Label>
            <Input
              id="lesson-topic"
              name="topic"
              placeholder="Solving linear equations"
              required
            />
          </div>
          <div>
            <Label htmlFor="lesson-minutes">Minutes</Label>
            <Input
              id="lesson-minutes"
              name="minutes"
              type="number"
              min={5}
              max={180}
              defaultValue={30}
            />
          </div>
          <div>
            <Label htmlFor="lesson-skills">Skills</Label>
            <Input
              id="lesson-skills"
              name="skills"
              placeholder="algebra, reasoning"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="outline" disabled={drafting}>
              {drafting ? "Drafting..." : "Draft"}
            </Button>
          </div>
        </form>
        {draftState?.error ? <Alert tone="error">{draftState.error}</Alert> : null}

        {draftState?.draft ? (
          <form action={saveFormAction} className="space-y-3 border-t border-line pt-4">
            {saveState?.error ? <Alert tone="error">{saveState.error}</Alert> : null}
            {saveState?.ok ? <Alert tone="success">Lesson added.</Alert> : null}
            <div>
              <Label htmlFor="draft-module">Module</Label>
              <Select id="draft-module" name="moduleId" required>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="draft-title">Title</Label>
              <Input
                id="draft-title"
                name="title"
                defaultValue={draftState.draft.title}
                required
              />
            </div>
            <div>
              <Label htmlFor="draft-content">Content</Label>
              <Textarea
                id="draft-content"
                name="content"
                rows={9}
                defaultValue={draftState.draft.content}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Adding..." : "Add to module"}
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

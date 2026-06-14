"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gradeSubmissionAction, type FormState } from "@/lib/actions/lms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function GradeForm({
  slug,
  courseId,
  assignmentId,
  studentId,
  initialGrade,
  initialFeedback,
  initialFeedbackStrengths = "",
  initialFeedbackNeeds = "",
  initialFeedbackNext = "",
  initialSkillTags = [],
}: {
  slug: string;
  courseId: string;
  assignmentId: string;
  studentId: string;
  initialGrade: number | null;
  initialFeedback: string;
  initialFeedbackStrengths?: string;
  initialFeedbackNeeds?: string;
  initialFeedbackNext?: string;
  initialSkillTags?: string[];
}) {
  const action = gradeSubmissionAction.bind(
    null,
    slug,
    courseId,
    assignmentId,
    studentId,
  );
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined,
  );
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="feedback" value={initialFeedback} />

      <div className="flex flex-wrap items-end gap-2">
        <div className="w-24">
          <label className="mb-1 block text-xs font-semibold text-muted">
            Grade
          </label>
          <Input
            name="grade"
            type="number"
            defaultValue={initialGrade ?? ""}
            className="h-9 text-sm"
          />
        </div>
        <div className="min-w-44 flex-1">
          <label className="mb-1 block text-xs font-semibold text-muted">
            Skill tags
          </label>
          <Input
            name="skillTags"
            defaultValue={initialSkillTags.join(", ")}
            placeholder="research, writing"
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">
            Strengths
          </label>
          <Textarea
            name="feedbackStrengths"
            defaultValue={initialFeedbackStrengths}
            rows={3}
            className="text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">
            Needs improvement
          </label>
          <Textarea
            name="feedbackNeeds"
            defaultValue={initialFeedbackNeeds}
            rows={3}
            className="text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">
            Next step
          </label>
          <Textarea
            name="feedbackNext"
            defaultValue={initialFeedbackNext}
            rows={3}
            className="text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {state?.error ? (
          <p className="text-xs font-semibold text-rose-600">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Saving..." : "Save feedback"}
        </Button>
      </div>
    </form>
  );
}

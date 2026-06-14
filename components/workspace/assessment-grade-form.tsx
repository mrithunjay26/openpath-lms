"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gradeAttemptAction, type FormState } from "@/lib/actions/assessments";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AssessmentGradeForm({
  workspace,
  courseId,
  assessmentId,
  studentId,
  autoScore,
}: {
  workspace: string;
  courseId: string;
  assessmentId: string;
  studentId: string;
  autoScore: number;
}) {
  const action = gradeAttemptAction.bind(
    null,
    workspace,
    courseId,
    assessmentId,
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
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="w-40">
        <label className="mb-1 block text-xs font-semibold text-muted">
          Manual points (short answers)
        </label>
        <Input name="manualScore" type="number" min={0} className="h-9 text-sm" />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Saving…" : `Finalize (auto ${autoScore})`}
      </Button>
      {state?.error ? (
        <p className="w-full text-xs font-semibold text-rose-600">{state.error}</p>
      ) : null}
    </form>
  );
}

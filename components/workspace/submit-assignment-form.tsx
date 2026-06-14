"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { submitAssignmentAction, type FormState } from "@/lib/actions/lms";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function SubmitAssignmentForm({
  slug,
  courseId,
  assignmentId,
  resubmit,
}: {
  slug: string;
  courseId: string;
  assignmentId: string;
  resubmit?: boolean;
}) {
  const action = submitAssignmentAction.bind(null, slug, courseId, assignmentId);
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
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.ok ? <Alert tone="success">Your work was submitted.</Alert> : null}
      <input
        type="file"
        name="file"
        required
        className="block w-full text-sm text-muted file:mr-3 file:rounded-pill file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-ink hover:file:opacity-90"
      />
      <Button type="submit" disabled={pending}>
        <Upload className="size-4" />
        {pending ? "Uploading…" : resubmit ? "Resubmit" : "Submit assignment"}
      </Button>
    </form>
  );
}

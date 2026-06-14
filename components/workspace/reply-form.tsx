"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { addPostAction, type FormState } from "@/lib/actions/discussions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function ReplyForm({
  workspace,
  courseId,
  discussionId,
}: {
  workspace: string;
  courseId: string;
  discussionId: string;
}) {
  const action = addPostAction.bind(null, workspace, courseId, discussionId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined,
  );
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={ref} action={formAction} className="space-y-2">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      <Textarea name="body" placeholder="Write a reply…" rows={3} required />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Posting…" : "Reply"}
        </Button>
      </div>
    </form>
  );
}

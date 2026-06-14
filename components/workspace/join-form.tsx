"use client";

import { useActionState } from "react";
import { joinByCodeAction, type FormState } from "@/lib/actions/people";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function JoinForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    joinByCodeAction,
    undefined,
  );
  return (
    <form action={action} className="space-y-4">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      <Textarea
        name="code"
        placeholder="ABCD-1234, WXYZ-5678"
        required
        autoFocus
        autoComplete="off"
        className="min-h-24 text-center text-lg font-bold uppercase tracking-[0.22em]"
      />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Joining..." : "Join workspace(s)"}
      </Button>
      <p className="text-center text-xs text-muted">
        Paste one code or several codes separated by commas or new lines.
      </p>
    </form>
  );
}

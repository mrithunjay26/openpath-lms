"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { askHintAction, type HintState } from "@/lib/actions/ai";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function StudentHintPanel({
  workspace,
  courseId,
  context,
}: {
  workspace: string;
  courseId: string;
  context: string;
}) {
  const action = askHintAction.bind(null, workspace, courseId);
  const [state, formAction, pending] = useActionState<HintState, FormData>(
    action,
    undefined,
  );

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-2xl bg-purple/12 text-purple">
            <Sparkles className="size-4.5" />
          </span>
          <h2 className="font-bold text-ink">Hint helper</h2>
        </div>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="context" value={context} />
          <Textarea
            name="question"
            rows={3}
            placeholder="Ask for a nudge..."
            required
          />
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? "Thinking..." : "Get a hint"}
          </Button>
        </form>
        {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state?.answer ? <Alert tone="info">{state.answer}</Alert> : null}
      </CardContent>
    </Card>
  );
}

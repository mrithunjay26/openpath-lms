"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { submitAttemptAction, type FormState } from "@/lib/actions/assessments";
import type { QuestionType } from "@/lib/firebase-assessments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// Question without the answer key (never sent to students).
export type SafeQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  points: number;
};

type Answers = Record<string, number[] | string>;

export function AssessmentTaker({
  workspace,
  courseId,
  assessmentId,
  questions,
}: {
  workspace: string;
  courseId: string;
  assessmentId: string;
  questions: SafeQuestion[];
}) {
  const action = submitAttemptAction.bind(null, workspace, courseId, assessmentId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined,
  );
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  const setChoice = (qid: string, idx: number, multi: boolean) => {
    setAnswers((a) => {
      if (!multi) return { ...a, [qid]: [idx] };
      const cur = Array.isArray(a[qid]) ? (a[qid] as number[]) : [];
      const set = new Set(cur);
      if (set.has(idx)) {
        set.delete(idx);
      } else {
        set.add(idx);
      }
      return { ...a, [qid]: [...set] };
    });
  };

  return (
    <form action={formAction} className="space-y-5">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      <input type="hidden" name="answers" value={JSON.stringify(answers)} />

      {questions.map((q, idx) => {
        const selected = Array.isArray(answers[q.id])
          ? (answers[q.id] as number[])
          : [];
        return (
          <Card key={q.id}>
            <CardContent className="p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <p className="font-semibold text-ink">
                  {idx + 1}. {q.prompt}
                </p>
                <span className="shrink-0 text-xs font-semibold text-muted">
                  {q.points} pt{q.points === 1 ? "" : "s"}
                </span>
              </div>

              {q.type === "short" ? (
                <Textarea
                  value={(answers[q.id] as string) || ""}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                  }
                  placeholder="Type your answer…"
                  rows={3}
                />
              ) : (
                <div className="space-y-2">
                  {q.options.map((opt, i) => {
                    const multi = q.type === "multi";
                    const on = selected.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setChoice(q.id, i, multi)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-colors",
                          on
                            ? "border-primary bg-primary/5 text-ink"
                            : "border-line hover:border-ink/20",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-5 shrink-0 place-items-center border text-[10px] font-bold text-white",
                            multi ? "rounded-md" : "rounded-full",
                            on ? "border-primary bg-primary" : "border-line",
                          )}
                        >
                          {on ? "✓" : ""}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end border-t border-line pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit quiz"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Trash2, GripVertical } from "lucide-react";
import {
  createAssessmentAction,
  type FormState,
} from "@/lib/actions/assessments";
import {
  generateQuizAction as generateAIQuizAction,
  type GenerateState,
} from "@/lib/actions/ai";
import type { QuestionType } from "@/lib/firebase-assessments";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type Q = {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  correct: number[];
  points: number;
};

let counter = 0;
const newId = () => `q${Date.now()}_${counter++}`;

function blankQuestion(type: QuestionType = "mcq"): Q {
  if (type === "truefalse")
    return { id: newId(), type, prompt: "", options: ["True", "False"], correct: [0], points: 1 };
  if (type === "short")
    return { id: newId(), type, prompt: "", options: [], correct: [], points: 1 };
  return { id: newId(), type, prompt: "", options: ["", ""], correct: [], points: 1 };
}

export function QuizBuilder({
  workspace,
  courseId,
}: {
  workspace: string;
  courseId: string;
}) {
  const action = createAssessmentAction.bind(null, workspace, courseId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined,
  );
  const router = useRouter();
  const [questions, setQuestions] = useState<Q[]>([blankQuestion()]);
  const loadAIQuestions = useCallback((draft: Q[]) => {
    setQuestions(draft);
  }, []);

  useEffect(() => {
    if (state?.ok)
      router.push(`/${workspace}/courses/${courseId}/assessments`);
  }, [state, router, workspace, courseId]);

  const update = (id: string, patch: Partial<Q>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const total = questions.reduce((s, q) => s + (Number(q.points) || 0), 0);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      <input type="hidden" name="questions" value={JSON.stringify(questions)} />

      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <Label htmlFor="title">Quiz title</Label>
            <Input id="title" name="title" placeholder="Unit 3 Check-in" required />
          </div>
          <div>
            <Label htmlFor="description">Instructions (optional)</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueAt">Due date (optional)</Label>
              <Input id="dueAt" name="dueAt" type="datetime-local" />
            </div>
            <div>
              <Label htmlFor="timeLimit">Time limit (min, optional)</Label>
              <Input id="timeLimit" name="timeLimit" type="number" min={0} />
            </div>
          </div>
        </CardContent>
      </Card>

      <AIQuizDraftPanel
        workspace={workspace}
        courseId={courseId}
        onQuestions={loadAIQuestions}
      />

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <Card key={q.id}>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <GripVertical className="size-4 text-muted/50" />
                <span className="text-sm font-bold text-ink">
                  Question {idx + 1}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <Select
                    value={q.type}
                    onChange={(e) =>
                      update(q.id, {
                        ...blankQuestion(e.target.value as QuestionType),
                        id: q.id,
                        prompt: q.prompt,
                        points: q.points,
                      })
                    }
                    className="h-9 w-36 text-sm"
                  >
                    <option value="mcq">Multiple choice</option>
                    <option value="multi">Select all</option>
                    <option value="truefalse">True / False</option>
                    <option value="short">Short answer</option>
                  </Select>
                  {questions.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setQuestions((qs) => qs.filter((x) => x.id !== q.id))
                      }
                      className="grid size-9 place-items-center rounded-xl text-muted hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>
              </div>

              <Textarea
                value={q.prompt}
                onChange={(e) => update(q.id, { prompt: e.target.value })}
                placeholder="Ask a question…"
                rows={2}
                className="mb-3"
              />

              {q.type === "short" ? (
                <p className="text-xs text-muted">
                  Short answers are graded manually after submission.
                </p>
              ) : (
                <OptionEditor q={q} update={update} />
              )}

              <div className="mt-3 flex w-32 items-center gap-2">
                <Label className="mb-0 text-xs">Points</Label>
                <Input
                  type="number"
                  min={0}
                  value={q.points}
                  onChange={(e) =>
                    update(q.id, { points: Number(e.target.value) || 0 })
                  }
                  className="h-9 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setQuestions((qs) => [...qs, blankQuestion()])}
        >
          <Plus className="size-4" /> Add question
        </Button>
        <span className="text-sm font-semibold text-muted">
          {questions.length} question{questions.length === 1 ? "" : "s"} ·{" "}
          {total} points
        </span>
      </div>

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Publishing…" : "Publish quiz"}
        </Button>
      </div>
    </form>
  );
}

function AIQuizDraftPanel({
  workspace,
  courseId,
  onQuestions,
}: {
  workspace: string;
  courseId: string;
  onQuestions: (questions: Q[]) => void;
}) {
  const action = generateAIQuizAction.bind(null, workspace, courseId);
  const [state, formAction, pending] = useActionState<GenerateState, FormData>(
    action,
    undefined,
  );

  useEffect(() => {
    if (state?.questions?.length) {
      onQuestions(state.questions.map((q) => ({ ...q })));
    }
  }, [state, onQuestions]);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-2xl bg-purple/12 text-purple">
            <Sparkles className="size-4.5" />
          </span>
          <h2 className="font-bold text-ink">AI draft</h2>
        </div>
        <form action={formAction} className="grid gap-3 md:grid-cols-[1fr_110px_auto]">
          <div>
            <Label htmlFor="ai-topic">Topic</Label>
            <Input
              id="ai-topic"
              name="topic"
              placeholder="Photosynthesis, chapters 4-5"
            />
          </div>
          <div>
            <Label htmlFor="ai-count">Questions</Label>
            <Input
              id="ai-count"
              name="count"
              type="number"
              min={1}
              max={15}
              defaultValue={5}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="outline" disabled={pending}>
              {pending ? "Drafting..." : "Draft"}
            </Button>
          </div>
        </form>
        {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state?.questions?.length ? (
          <Alert tone="success">
            Draft loaded. Review answers and point values before publishing.
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}

function OptionEditor({
  q,
  update,
}: {
  q: Q;
  update: (id: string, patch: Partial<Q>) => void;
}) {
  const toggleCorrect = (i: number) => {
    if (q.type === "multi") {
      const set = new Set(q.correct);
      if (set.has(i)) {
        set.delete(i);
      } else {
        set.add(i);
      }
      update(q.id, { correct: [...set] });
    } else {
      update(q.id, { correct: [i] });
    }
  };

  const editable = q.type !== "truefalse";

  return (
    <div className="space-y-2">
      {q.options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleCorrect(i)}
            className={cn(
              "grid size-6 shrink-0 place-items-center rounded-md border text-xs font-bold transition-colors",
              q.correct.includes(i)
                ? "border-green bg-green/15 text-[#2f8a51]"
                : "border-line text-muted hover:border-ink/30",
            )}
            title="Mark correct"
            aria-label="Mark correct"
          >
            {q.correct.includes(i) ? "✓" : ""}
          </button>
          {editable ? (
            <Input
              value={opt}
              onChange={(e) => {
                const options = [...q.options];
                options[i] = e.target.value;
                update(q.id, { options });
              }}
              placeholder={`Option ${i + 1}`}
              className="h-9 text-sm"
            />
          ) : (
            <span className="text-sm font-medium text-ink">{opt}</span>
          )}
          {editable && q.options.length > 2 ? (
            <button
              type="button"
              onClick={() => {
                const options = q.options.filter((_, j) => j !== i);
                const correct = q.correct
                  .filter((c) => c !== i)
                  .map((c) => (c > i ? c - 1 : c));
                update(q.id, { options, correct });
              }}
              className="grid size-8 place-items-center rounded-lg text-muted hover:text-rose-600"
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
        </div>
      ))}
      {editable ? (
        <button
          type="button"
          onClick={() => update(q.id, { options: [...q.options, ""] })}
          className="text-xs font-semibold text-primary hover:underline"
        >
          + Add option
        </button>
      ) : null}
      <p className="text-xs text-muted">
        {q.type === "multi"
          ? "Tap the box to mark all correct options."
          : "Tap the box to mark the correct option."}
      </p>
    </div>
  );
}

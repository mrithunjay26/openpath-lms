"use client";

import { useActionState, useState } from "react";
import { createWorkspaceAction, type FormState } from "@/lib/actions/tenant";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { slugify } from "@/lib/utils";

export function CreateWorkspaceForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createWorkspaceAction,
    undefined,
  );
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [edited, setEdited] = useState(false);

  const effectiveSlug = edited ? slug : slugify(name);

  return (
    <form action={action} className="space-y-5">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}

      <div>
        <Label htmlFor="name">Workspace name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Rivera Math Studio"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        <p className="mt-1.5 text-xs text-muted">
          The name students see at the top of their dashboard.
        </p>
      </div>

      <div>
        <Label htmlFor="slug">Workspace URL</Label>
        <div className="flex items-center rounded-2xl border border-line bg-surface px-4 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
          <span className="text-sm text-muted">openpath/</span>
          <input
            id="slug"
            name="slug"
            value={effectiveSlug}
            onChange={(e) => {
              setEdited(true);
              setSlug(slugify(e.target.value));
            }}
            placeholder="rivera-math"
            className="h-11 flex-1 bg-transparent pl-1 text-sm font-semibold text-ink outline-none placeholder:font-normal placeholder:text-muted/60"
            required
          />
        </div>
        <p className="mt-1.5 text-xs text-muted">
          Lowercase letters, numbers, and dashes. This becomes your link.
        </p>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={pending || !name}
      >
        {pending ? "Creating…" : "Create workspace"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { saveAIConfigAction, type ConfigState } from "@/lib/actions/ai";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function AISettingsForm({
  workspace,
  initialEnabled,
  initialModel,
  configured,
}: {
  workspace: string;
  initialEnabled: boolean;
  initialModel: string;
  configured: boolean;
}) {
  const action = saveAIConfigAction.bind(null, workspace);
  const [state, formAction, pending] = useActionState<ConfigState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.ok ? <Alert tone="success">AI settings saved.</Alert> : null}

      <div className="rounded-2xl border border-line bg-cream/45 p-4">
        <label className="flex items-center gap-3 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={initialEnabled}
            className="size-4 accent-[var(--color-primary)]"
          />
          Enable AI Copilot
        </label>
      </div>

      <div>
        <Label htmlFor="model">Anthropic model</Label>
        <Select id="model" name="model" defaultValue={initialModel}>
          <option value="claude-3-5-haiku-latest">Claude 3.5 Haiku</option>
          <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet</option>
          <option value="claude-3-7-sonnet-latest">Claude 3.7 Sonnet</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="apiKey">API key</Label>
        <Input
          id="apiKey"
          name="apiKey"
          type="password"
          autoComplete="off"
          placeholder={
            configured ? "Leave blank to keep current key" : "sk-ant-..."
          }
        />
        <p className="mt-2 text-xs font-medium text-muted">
          The key is verified once and stored encrypted. It is never shown again.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save AI settings"}
        </Button>
      </div>
    </form>
  );
}

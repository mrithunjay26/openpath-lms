"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { connectFirebaseAction, type FormState } from "@/lib/actions/tenant";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function FirebaseForm({
  slug,
  storageBucket,
}: {
  slug: string;
  storageBucket?: string | null;
}) {
  const action = connectFirebaseAction.bind(null, slug);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state?.ok ? (
        <Alert tone="success">
          Firebase connected and verified. Courses, files, and assignments are
          now live.
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="serviceAccount">Service account JSON</Label>
        <Textarea
          id="serviceAccount"
          name="serviceAccount"
          rows={9}
          required
          placeholder={`{\n  "type": "service_account",\n  "project_id": "your-project",\n  "private_key": "[redacted private key]",\n  "client_email": "service-account@your-project.iam.gserviceaccount.com"\n}`}
          className="font-mono text-xs"
          spellCheck={false}
        />
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
          <Lock className="size-3.5" />
          Encrypted with AES-256-GCM before it&apos;s stored. We verify it before
          saving.
        </p>
      </div>

      <div>
        <Label htmlFor="storageBucket">Storage bucket (optional)</Label>
        <Input
          id="storageBucket"
          name="storageBucket"
          placeholder="your-project.appspot.com"
          defaultValue={storageBucket ?? ""}
        />
        <p className="mt-1.5 text-xs text-muted">
          Needed for file uploads and assignment submissions.
        </p>
      </div>

      <details className="rounded-2xl border border-line bg-cream/40 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink">
          Web app config (optional)
        </summary>
        <div className="mt-3">
          <Textarea
            name="clientConfig"
            rows={6}
            placeholder={`{\n  "apiKey": "...",\n  "authDomain": "your-project.firebaseapp.com",\n  "projectId": "your-project",\n  "databaseURL": "https://your-project-default-rtdb.firebaseio.com"\n}`}
            className="font-mono text-xs"
            spellCheck={false}
          />
          <p className="mt-1.5 text-xs text-muted">
            The public web config (low sensitivity). Include `databaseURL` if
            you want realtime presence and typing indicators.
          </p>
        </div>
      </details>

      <Button type="submit" disabled={pending}>
        {pending ? "Verifying connection..." : "Connect & verify"}
      </Button>
    </form>
  );
}

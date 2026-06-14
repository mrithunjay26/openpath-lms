"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type State = { error?: string; ok?: boolean } | undefined;

/**
 * A trigger button that opens a modal containing a server-action form.
 * Auto-closes and refreshes the route on success. Field inputs are passed in
 * as children (uncontrolled — read from FormData by the action).
 */
export function ModalForm({
  triggerLabel,
  triggerIcon,
  triggerVariant = "primary",
  triggerSize = "sm",
  title,
  submitLabel = "Save",
  action,
  children,
}: {
  triggerLabel: string;
  triggerIcon?: "plus";
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  title: string;
  submitLabel?: string;
  action: (prev: State, formData: FormData) => Promise<State>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<State, FormData>(
    action,
    undefined,
  );
  const router = useRouter();
  const Icon = triggerIcon === "plus" ? Plus : null;

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <>
      <Button
        variant={triggerVariant}
        size={triggerSize}
        onClick={() => setOpen(true)}
      >
        {Icon ? <Icon className="size-4" /> : null}
        {triggerLabel}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        <form action={formAction} className="space-y-4">
          {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
          {children}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : submitLabel}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

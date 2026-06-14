"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Paperclip, Send } from "lucide-react";
import { sendChatMessageAction, type FormState } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";

type Preview = {
  name: string;
  type: string;
  url: string;
  size: number;
};

export function ChatComposer({
  slug,
  conversationId,
  disabled,
}: {
  slug: string;
  conversationId: string;
  disabled?: boolean;
}) {
  const action = sendChatMessageAction.bind(null, slug, conversationId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined,
  );
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const typingTimer = useRef<number | null>(null);
  const heartbeatTimer = useRef<number | null>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [message, setMessage] = useState("");
  const endpoint = `/api/${slug}/chat-state`;

  useEffect(() => {
    if (state?.ok) {
      setPreviews([]);
      setMessage("");
      if (fileRef.current) fileRef.current.value = "";
      void fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, typing: false }),
        keepalive: true,
      }).catch(() => undefined);
      router.refresh();
    }
  }, [conversationId, endpoint, router, state]);

  useEffect(() => {
    return () => {
      previews.forEach((file) => {
        if (file.url.startsWith("blob:")) URL.revokeObjectURL(file.url);
      });
    };
  }, [previews]);

  useEffect(() => {
    if (disabled) return;
    let cancelled = false;

    const ping = async (typing: boolean) => {
      try {
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, typing }),
          keepalive: true,
        });
      } catch {
        if (!cancelled) {
          // Keep going even if realtime metadata is temporarily unavailable.
        }
      }
    };

    void ping(false);
    heartbeatTimer.current = window.setInterval(() => {
      void ping(false);
    }, 20_000);

    return () => {
      cancelled = true;
      if (heartbeatTimer.current) window.clearInterval(heartbeatTimer.current);
      if (typingTimer.current) window.clearTimeout(typingTimer.current);
      void fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, leave: true }),
        keepalive: true,
      }).catch(() => undefined);
    };
  }, [conversationId, disabled, endpoint]);

  return (
    <form action={formAction} className="space-y-3 border-t border-line pt-4">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      <Textarea
        name="body"
        placeholder="Write a message..."
        rows={4}
        disabled={disabled || pending}
        value={message}
        onChange={(event) => {
          const next = event.target.value;
          setMessage(next);
          if (typingTimer.current) window.clearTimeout(typingTimer.current);
          if (disabled) return;
          typingTimer.current = window.setTimeout(() => {
            void fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                conversationId,
                typing: next.trim().length > 0,
              }),
              keepalive: true,
            }).catch(() => undefined);
          }, 450);
        }}
      />
      {previews.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {previews.map((file) => (
            <div
              key={`${file.name}-${file.url}`}
              className="overflow-hidden rounded-2xl border border-line bg-background/70"
            >
              <div className="flex items-center gap-3 p-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
                  {file.type.startsWith("image/") ? (
                    <ImageIcon className="size-5" />
                  ) : (
                    <Paperclip className="size-5" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              {file.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.url}
                  alt={file.name}
                  className="max-h-40 w-full object-cover"
                />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-primary/50">
          <Paperclip className="size-4 text-muted" />
          Attach files
          <input
            ref={fileRef}
            name="files"
            type="file"
            multiple
            className="sr-only"
            disabled={disabled || pending}
            onChange={(e) => {
              const next = Array.from(e.target.files ?? []).map((file) => ({
                name: file.name,
                type: file.type || "application/octet-stream",
                url: URL.createObjectURL(file),
                size: file.size,
              }));
              setPreviews((current) => {
                current.forEach((file) => {
                  if (file.url.startsWith("blob:")) URL.revokeObjectURL(file.url);
                });
                return next;
              });
            }}
          />
        </label>
        <Button type="submit" disabled={disabled || pending}>
          <Send className="size-4" />
          {pending ? "Sending..." : "Send"}
        </Button>
      </div>
    </form>
  );
}

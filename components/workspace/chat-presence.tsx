"use client";

import { useEffect, useState } from "react";
import { Wifi } from "lucide-react";
import type { ChatPresenceRecord } from "@/lib/firebase-realtime";
import { cn } from "@/lib/utils";

type PresenceState = {
  online: ChatPresenceRecord[];
  typing: ChatPresenceRecord[];
  updatedAt: number;
};

export function ChatPresence({
  slug,
  conversationId,
  initial,
}: {
  slug: string;
  conversationId: string;
  initial: PresenceState;
}) {
  const [state, setState] = useState(initial);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(
          `/api/${slug}/chat-state?conversationId=${encodeURIComponent(conversationId)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const next = (await res.json()) as PresenceState;
        if (!cancelled) setState(next);
      } catch {
        // Ignore transient network issues; the server snapshot remains visible.
      }
    };

    load();
    const timer = window.setInterval(load, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [conversationId, slug]);

  const typingNames = state.typing.slice(0, 2).map((p) => p.name);
  const typingLabel =
    typingNames.length > 0
      ? `${typingNames.join(" and ")} ${typingNames.length > 1 ? "are" : "is"} typing`
      : "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-background/60 px-3 py-1 text-xs font-semibold text-muted">
        <Wifi className="size-3.5 text-teal" />
        {state.online.length} online
      </span>
      {typingLabel ? (
        <span
          className={cn(
            "inline-flex items-center rounded-pill border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-ink",
          )}
        >
          {typingLabel}
        </span>
      ) : (
        <span className="text-xs text-muted">Live presence updates enabled</span>
      )}
    </div>
  );
}

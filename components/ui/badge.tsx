import * as React from "react";
import { cn } from "@/lib/utils";

type Tone =
  | "neutral"
  | "primary"
  | "pink"
  | "teal"
  | "yellow"
  | "green"
  | "purple";

// Bright accent text on a translucent fill reads well on the dark canvas.
const tones: Record<Tone, string> = {
  neutral: "bg-white/8 text-muted",
  primary: "bg-primary/15 text-[#9aa6ff]",
  pink: "bg-pink/15 text-pink",
  teal: "bg-teal/15 text-teal",
  yellow: "bg-yellow/15 text-yellow",
  green: "bg-green/15 text-green",
  purple: "bg-purple/15 text-purple",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

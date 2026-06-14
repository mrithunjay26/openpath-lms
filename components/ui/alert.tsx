import * as React from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "error" | "success" | "info" | "warning";

const config: Record<Tone, { cls: string; Icon: React.ElementType }> = {
  error: {
    cls: "bg-rose-500/12 text-rose-300 border-rose-500/30",
    Icon: AlertCircle,
  },
  success: {
    cls: "bg-emerald-500/12 text-emerald-300 border-emerald-500/30",
    Icon: CheckCircle2,
  },
  info: { cls: "bg-primary/12 text-[#aab2ff] border-primary/30", Icon: Info },
  warning: {
    cls: "bg-amber-500/12 text-amber-300 border-amber-500/30",
    Icon: TriangleAlert,
  },
};

export function Alert({
  tone = "info",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  const { cls, Icon } = config[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium",
        cls,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

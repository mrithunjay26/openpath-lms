import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-dashed border-line bg-surface/60 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-cream text-primary">
          <Icon className="size-7" aria-hidden />
        </div>
      )}
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "accent"
  | "outline"
  | "ghost"
  | "subtle"
  | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-pill transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  // Filled via background-IMAGE (themable through --color-primary) so the button
  // stays solid even under aggressive resets like `a{background-color:transparent}`
  // injected by some browser extensions. Visually identical to a solid fill.
  primary:
    "bg-[linear-gradient(var(--color-primary),var(--color-primary))] text-primary-ink shadow-[0_10px_28px_-12px_rgba(91,108,255,0.75)] hover:-translate-y-0.5 hover:shadow-[0_16px_38px_-12px_rgba(91,108,255,0.85)]",
  accent:
    "bg-gradient-hero text-white shadow-[0_10px_28px_-12px_rgba(255,82,151,0.7)] hover:-translate-y-0.5",
  outline:
    "bg-surface text-ink border border-line hover:border-ink/25 hover:-translate-y-0.5 shadow-sm",
  ghost: "text-ink/75 hover:text-ink hover:bg-ink/5",
  subtle: "bg-cream text-ink hover:bg-ink/[0.06]",
  danger:
    "bg-surface text-rose-600 border border-rose-200 hover:bg-rose-50",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
  icon: "h-10 w-10",
};

export function buttonVariants(
  opts: { variant?: Variant; size?: Size } = {},
) {
  const { variant = "primary", size = "md" } = opts;
  return cn(base, variants[variant], sizes[size]);
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

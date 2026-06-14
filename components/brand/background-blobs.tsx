import { cn } from "@/lib/utils";

/**
 * Decorative aurora background. Intentionally CHEAP: a single static gradient
 * layer plus thin stroked arcs and a few small dots — no blur filters, no
 * continuous animations, no will-change (those rasterize huge layers every
 * frame and were the main LCP/INP killer). Colors come from the workspace's
 * theme tokens; presence is scaled by `--shape-opacity` (0 = off).
 */
export function BackgroundBlobs({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className,
      )}
      style={{ opacity: "var(--shape-opacity, 1)" }}
    >
      <div className="absolute inset-0 bg-soft" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 1000"
        preserveAspectRatio="xMidYMin slice"
      >
        <defs>
          <linearGradient id="bb-cool" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--color-primary)" }} />
            <stop offset="100%" style={{ stopColor: "var(--color-teal)" }} />
          </linearGradient>
          <linearGradient id="bb-warm" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--color-accent)" }} />
            <stop offset="100%" style={{ stopColor: "var(--color-accent-2)" }} />
          </linearGradient>
        </defs>

        <path
          d="M 920 -160 A 530 530 0 0 1 1630 410"
          fill="none"
          stroke="url(#bb-cool)"
          strokeWidth="40"
          strokeLinecap="round"
          opacity="0.35"
        />
        <path
          d="M 20 760 A 280 280 0 0 1 420 544"
          fill="none"
          stroke="url(#bb-warm)"
          strokeWidth="30"
          strokeLinecap="round"
          opacity="0.35"
        />
        <g className="text-teal" opacity="0.5">
          <circle cx="120" cy="180" r="22" fill="currentColor" />
        </g>
        <g className="text-yellow" opacity="0.5">
          <circle cx="164" cy="152" r="12" fill="currentColor" />
        </g>
        <g className="text-purple" opacity="0.4">
          <circle cx="1330" cy="640" r="18" fill="currentColor" />
        </g>
        <g className="text-green" opacity="0.4">
          <circle cx="1180" cy="120" r="14" fill="currentColor" />
        </g>
      </svg>
    </div>
  );
}

import Link from "next/link";
import { cn } from "@/lib/utils";

const MARK_COLORS = [
  "text-pink",
  "text-orange",
  "text-yellow",
  "text-green",
  "text-primary",
];

export function BurstMark({ size = 34 }: { size?: number }) {
  const arcs = Array.from({ length: 5 }).map((_, i) => {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const cx = 20 + Math.cos(angle) * 11;
    const cy = 20 + Math.sin(angle) * 11;
    return {
      i,
      cx,
      cy,
      x1: cx + Math.cos(angle + 1.6) * 5,
      y1: cy + Math.sin(angle + 1.6) * 5,
      x2: cx + Math.cos(angle - 1.6) * 5,
      y2: cy + Math.sin(angle - 1.6) * 5,
    };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      {arcs.map((a) => (
        <g key={a.i} className={MARK_COLORS[a.i]}>
          <path
            d={`M ${a.x1} ${a.y1} A 9 9 0 0 1 ${a.x2} ${a.y2}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx={a.cx} cy={a.cy - 2.5} r="2.4" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

export function Logo({
  href = "/",
  className,
  withWordmark = true,
  size = 34,
}: {
  href?: string;
  className?: string;
  withWordmark?: boolean;
  size?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 font-display font-bold text-ink",
        className,
      )}
      aria-label="OpenPath home"
    >
      <BurstMark size={size} />
      {withWordmark && (
        <span className="text-xl tracking-tight">
          Open<span className="text-gradient">Path</span>
        </span>
      )}
    </Link>
  );
}

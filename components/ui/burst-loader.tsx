const COLORS = [
  "text-pink",
  "text-orange",
  "text-yellow",
  "text-green",
  "text-primary",
];

/** Spinning 5-arc "burst" loader (matches the StuImpact prototype motif). */
export function BurstLoader({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ overflow: "visible" }}
      role="status"
      aria-label="Loading"
    >
      <g
        style={{
          transformOrigin: "50px 50px",
          animation: "spin 2.2s linear infinite",
        }}
      >
        {COLORS.map((c, i) => (
          <g key={i} transform={`rotate(${(i / 5) * 360} 50 50)`} className={c}>
            <path
              d="M 36 56 A 18 18 0 0 1 64 44"
              fill="none"
              stroke="currentColor"
              strokeWidth="6.5"
              strokeLinecap="round"
            />
            <circle cx="64" cy="34" r="5.5" fill="currentColor" />
          </g>
        ))}
      </g>
    </svg>
  );
}

"use client";
// File responsibility: circular funding progress badge — small dark ring with
// an orange progress arc and a centered percent label. Pure presentational;
// progress is 0..1 (clamped), the label carries the readable percent.
export function FundingRing({ progress, label }: { progress: number; label: string }) {
  const p = Math.min(1, Math.max(0, progress));
  const R = 22;
  const C = 2 * Math.PI * R;

  return (
    <div
      className="absolute start-3 top-3 flex size-14 items-center justify-center rounded-full bg-black/55 ring-1 ring-white/20 backdrop-blur-sm"
      data-testid="funding-ring"
      role="img"
      aria-label={label}
    >
      <svg viewBox="0 0 52 52" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx="26" cy="26" r={R} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="4" />
        <circle
          cx="26"
          cy="26"
          r={R}
          fill="none"
          className="text-warning"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          data-testid="funding-ring-arc"
          strokeDasharray={`${C * p} ${C}`}
        />
      </svg>
      <span className="relative text-[0.6875rem] font-bold tabular-nums text-white">{label}</span>
    </div>
  );
}

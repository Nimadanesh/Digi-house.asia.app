// File responsibility: FundingBar — track + scaleX fill. DESIGN_SYSTEM "Funding / progress bar":
// width animates 280ms via transform: scaleX() with transform-origin: left. NEVER animate width.
// Inline style.transform is the sanctioned way to set fractional scaleX (no Tailwind class fits).
// Reduced-motion: drop the transform animation entirely (the bar just renders at its progress).
import { cn } from "@/lib/utils";

export function FundingBar({ progress, funded = false, className }: { progress: number; funded?: boolean; className?: string }) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <div className={cn("h-[6px] rounded-full bg-surface-2 overflow-hidden", className)}>
      <div
        className={cn("funding-bar-fill h-full rounded-full", funded ? "bg-success" : "bg-primary")}
        style={{ transform: `scaleX(${clamped})`, transformOrigin: "left", transition: "transform 280ms var(--ease-tg-out)" }}
      />
    </div>
  );
}
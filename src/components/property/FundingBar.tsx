// File responsibility: FundingBar — track + scaleX fill. DESIGN_SYSTEM "Funding / progress bar":
// width animates 280ms via transform: scaleX() with transform-origin: left. NEVER animate width.
// Inline style.transform is the sanctioned way to set fractional scaleX (no Tailwind class fits).
import { cn } from "@/lib/utils";

export function FundingBar({ progress, funded = false, className }: { progress: number; funded?: boolean; className?: string }) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <div className={cn("h-[6px] rounded-full bg-surface-2 overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full", funded ? "bg-success" : "bg-primary")}
        style={{ transform: `scaleX(${clamped})`, transformOrigin: "left", transition: "transform 280ms cubic-bezier(0.23, 1, 0.32, 1)" }}
      />
    </div>
  );
}
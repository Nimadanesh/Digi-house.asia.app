"use client";
// File responsibility: accessible iOS-style switch presentational primitive. Pure — no hooks, no domain imports.
// DESIGN_SYSTEM §"Buttons" tap ≥44×44 + press scale 0.97; §"Motion" 200ms ease-out on transform/color.
import { cn } from "@/lib/utils";

export function Toggle({
  on,
  onChange,
  "aria-label": ariaLabel,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-200 ease-out active:scale-[0.97]",
        on ? "bg-primary" : "bg-surface-2",
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] size-[22px] rounded-full bg-white transition-transform duration-200 ease-out",
          on ? "translate-x-[20px]" : "translate-x-[2px]",
        )}
      />
    </button>
  );
}
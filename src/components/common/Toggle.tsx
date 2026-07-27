"use client";
// File responsibility: accessible iOS-style switch presentational primitive.
// Optional onHaptic keeps domain out — callers pass selection feedback.
import { cn } from "@/lib/utils";

export function Toggle({
  on,
  onChange,
  onHaptic,
  "aria-label": ariaLabel,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  onHaptic?: () => void;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      data-state={on ? "on" : "off"}
      onClick={() => {
        onHaptic?.();
        onChange(!on);
      }}
      className={cn(
        "relative inline-flex h-[28px] w-[48px] shrink-0 items-center rounded-full p-[2px]",
        "transition-colors duration-200 ease-out active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        on ? "bg-primary justify-end" : "bg-surface-2 justify-start",
      )}
    >
      <span
        aria-hidden
        data-testid="toggle-thumb"
        className={cn(
          "pointer-events-none block size-[24px] shrink-0 rounded-full bg-white",
          "shadow-[0_1px_2px_rgba(0,0,0,0.28)]",
          "transition-transform duration-200 ease-out",
        )}
      />
    </button>
  );
}

"use client";
// File responsibility: full-screen Braille Flipwave onboarding loader — the house silhouette
// emerges from a blue dot-matrix wave (pure CSS/DOM), then fades+scales out on completion.
import { useEffect, useRef, useState } from "react";
import { HOUSE_MASK } from "@/lib/flipwave/house-mask";
import { FlipwaveGrid } from "@/components/flipwave/FlipwaveGrid";
import { cn } from "@/lib/utils";

// 2× the original cycle — an extended brand splash (reduced-motion shows static, leaves sooner).
const CYCLE_MS = 8800;
// On touch devices the wave flips once and settles (~3s), so a shorter splash is enough —
// it avoids ~4s of near-static full-screen animation on low-end phones/Telegram WebView.
const MOBILE_DISMISS_MS = 4400;
const EXIT_MS = 400;

export function OnboardingLoader({
  onComplete,
  progress,
}: {
  onComplete?: () => void;
  progress?: number;
}) {
  const onCompleteRef = useRef(onComplete);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const coarse =
      typeof window !== "undefined" &&
      window.matchMedia?.("(hover: none) and (pointer: coarse)").matches;

    const timers: number[] = [];
    let disposed = false;

    const dismissAfter = reduced ? 900 : coarse ? MOBILE_DISMISS_MS : CYCLE_MS;
    timers.push(
      window.setTimeout(() => {
        if (disposed) return;
        setFading(true);
        timers.push(
          window.setTimeout(() => {
            if (disposed) return;
            onCompleteRef.current?.();
          }, EXIT_MS),
        );
      }, dismissAfter),
    );

    return () => {
      disposed = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const clampedProgress =
    typeof progress === "number" ? Math.max(0, Math.min(100, progress)) : null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[400] flex flex-col items-center justify-center overflow-hidden bg-[#0B1220]",
        fading && "opacity-0 transition-opacity duration-[400ms] ease-out",
      )}
      data-testid="onboarding-loader"
      role="status"
      aria-label="Tokenizing real estate"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(51,144,236,0.08) 0%, rgba(11,18,32,0) 65%)",
        }}
      />

      <div
        aria-hidden
        className={cn(
          "transition-transform duration-[400ms] ease-out",
          fading && "scale-[1.05]",
        )}
      >
        <FlipwaveGrid
          mask={HOUSE_MASK}
          variant="house"
          flipUnlit
          cycleMs={CYCLE_MS}
        />
      </div>

      <div className="absolute bottom-[15svh] flex flex-col items-center gap-4">
        <p className="text-[14px] font-medium uppercase tracking-[0.2em] text-[#94A3B8]">
          Tokenizing real estate
          <span className="dh-loader-dots" aria-hidden>
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>
        {clampedProgress !== null ? (
          <div
            className="h-[2px] w-[180px] overflow-hidden rounded-full bg-[#1E293B]"
            data-testid="onboarding-loader-progress"
          >
            <div
              className="h-full rounded-full bg-[#3390EC] transition-[width] duration-300 ease-out"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

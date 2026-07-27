"use client";
// File responsibility: swipeable onboarding carousel + pagination dots (Fable Onboarding §Carousel).
// Swipe or tap content to advance; dots jump to slide.
import { useCallback, useRef, useState } from "react";
import { ONBOARDING_SLIDES, ONBOARDING_SLIDE_COUNT } from "@/lib/onboarding-slides";
import { cn } from "@/lib/utils";
import { OnboardingSlide } from "./OnboardingSlide";

export function OnboardingCarousel({
  index,
  onIndexChange,
  onSwipeHaptic,
}: {
  index: number;
  onIndexChange: (i: number) => void;
  onSwipeHaptic?: () => void;
}) {
  const startX = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(ONBOARDING_SLIDE_COUNT - 1, next));
      if (clamped === index) return;
      onIndexChange(clamped);
      onSwipeHaptic?.();
    },
    [index, onIndexChange, onSwipeHaptic],
  );

  return (
    <div className="flex flex-1 flex-col min-h-0" data-testid="onboarding-carousel">
      <div
        className="relative flex-1 overflow-hidden touch-pan-y cursor-pointer"
        role="presentation"
        onClick={() => {
          if (dragging) return;
          if (index < ONBOARDING_SLIDE_COUNT - 1) go(index + 1);
        }}
        onTouchStart={(e) => {
          startX.current = e.touches[0]?.clientX ?? null;
          setDragging(true);
        }}
        onTouchEnd={(e) => {
          if (startX.current == null) {
            setDragging(false);
            return;
          }
          const end = e.changedTouches[0]?.clientX ?? startX.current;
          const dx = end - startX.current;
          startX.current = null;
          const wasDrag = Math.abs(dx) >= 48;
          setDragging(false);
          if (!wasDrag) return;
          go(dx < 0 ? index + 1 : index - 1);
        }}
        onTouchCancel={() => {
          startX.current = null;
          setDragging(false);
        }}
      >
        <div
          className={cn(
            "flex h-full w-full",
            !dragging && "transition-transform duration-[280ms] ease-[var(--ease-tg-out)]",
          )}
          style={{ transform: `translateX(-${index * 100}%)` }}
          data-testid="onboarding-track"
        >
          {ONBOARDING_SLIDES.map((slide) => (
            <OnboardingSlide key={slide.id} slide={slide} />
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 py-4" aria-label="Onboarding progress" role="tablist">
        {ONBOARDING_SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-label={`Slide ${i + 1}`}
            aria-selected={i === index}
            onClick={(e) => {
              e.stopPropagation();
              go(i);
            }}
            className={cn(
              "h-2 rounded-full transition-all duration-200 ease-out",
              i === index ? "w-5 bg-primary" : "w-2 bg-border",
            )}
          />
        ))}
      </div>
    </div>
  );
}

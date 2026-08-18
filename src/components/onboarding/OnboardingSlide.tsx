"use client";
// File responsibility: single onboarding slide body (Fable Onboarding §Slide content).
import { useTranslations } from "next-intl";
import type { OnboardingSlideDef } from "@/lib/onboarding-slides";
import { OnboardingVisual } from "./OnboardingVisual";

export function OnboardingSlide({
  slide,
  active = true,
}: {
  slide: OnboardingSlideDef;
  /** False when this slide is off-screen — freezes its flip wave (perf). */
  active?: boolean;
}) {
  const t = useTranslations("onboarding");

  return (
    <div
      className="flex h-full w-full shrink-0 flex-col items-center justify-center px-2 text-center"
      data-testid={`onboarding-slide-${slide.id}`}
    >
      <OnboardingVisual slideId={slide.id} active={active} />
      <h1 className="mt-6 max-w-[20rem] text-[1.375rem] font-semibold leading-snug text-foreground">
        {t(`${slide.id}.headline`)}
      </h1>
      <p className="mt-3 max-w-[18rem] text-[0.9375rem] leading-relaxed text-muted-foreground">
        {t(`${slide.id}.subtitle`)}
      </p>
    </div>
  );
}

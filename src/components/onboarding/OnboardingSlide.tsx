"use client";
// File responsibility: single onboarding slide body (Fable Onboarding §Slide content).
import { useTranslations } from "next-intl";
import type { OnboardingSlideDef } from "@/lib/onboarding-slides";
import { OnboardingVisual } from "./OnboardingVisual";

export function OnboardingSlide({ slide }: { slide: OnboardingSlideDef }) {
  const t = useTranslations("onboarding");
  const headline = t(`${slide.id}.headline`);
  const subtitle = t(`${slide.id}.subtitle`);
  const showTrust = slide.id === "sell";

  return (
    <div
      className="flex h-full w-full shrink-0 flex-col items-center justify-center px-2 text-center"
      data-testid={`onboarding-slide-${slide.id}`}
    >
      <OnboardingVisual slideId={slide.id} />
      <h1 className="mt-6 max-w-[20rem] text-[1.375rem] font-semibold leading-snug text-foreground">
        {headline}
      </h1>
      <p className="mt-3 max-w-[18rem] text-[0.9375rem] leading-relaxed text-muted-foreground">
        {subtitle}
      </p>
      {showTrust ? (
        <p
          className="mt-5 max-w-[18rem] text-[0.75rem] leading-relaxed text-muted-foreground"
          data-testid="onboarding-trust"
        >
          {t("sell.trustLine")}
        </p>
      ) : null}
    </div>
  );
}

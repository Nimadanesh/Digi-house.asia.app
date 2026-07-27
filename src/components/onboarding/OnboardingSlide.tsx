// File responsibility: single onboarding slide body (Fable Onboarding §Slide content).
import type { OnboardingSlideDef } from "@/lib/onboarding-slides";
import { OnboardingVisual } from "./OnboardingVisual";

export function OnboardingSlide({ slide }: { slide: OnboardingSlideDef }) {
  return (
    <div
      className="flex h-full w-full shrink-0 flex-col items-center justify-center px-2 text-center"
      data-testid={`onboarding-slide-${slide.id}`}
    >
      <OnboardingVisual slideId={slide.id} />
      <h1 className="mt-6 max-w-[20rem] text-[1.375rem] font-semibold leading-snug text-foreground">
        {slide.headline}
      </h1>
      <p className="mt-2 max-w-[18rem] text-[0.9375rem] leading-relaxed text-muted-foreground">
        {slide.subtitle}
      </p>
      {slide.trustLine ? (
        <p className="mt-4 max-w-[18rem] text-[0.75rem] leading-snug text-muted-foreground" data-testid="onboarding-trust">
          {slide.trustLine}
        </p>
      ) : null}
    </div>
  );
}

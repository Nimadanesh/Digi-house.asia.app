// File responsibility: onboarding slide illustrations — each slide shows a Blue Braille Flipwave
// dot pattern themed to its copy (house / rising earnings / dollar sign). CSS/DOM, no three.js.
import type { OnboardingSlideDef } from "@/lib/onboarding-slides";
import { HOUSE_MASK } from "@/lib/flipwave/house-mask";
import { BARS_MASK, DOLLAR_MASK } from "@/lib/flipwave/slide-masks";
import { FlipwaveGrid } from "@/components/flipwave/FlipwaveGrid";
import type { FlipwaveVariant } from "@/lib/flipwave/flipwave-math";
import { cn } from "@/lib/utils";

const CONFIG: Record<
  OnboardingSlideDef["id"],
  { mask: readonly (readonly number[])[]; variant: FlipwaveVariant; cycleMs: number }
> = {
  own: { mask: HOUSE_MASK, variant: "house", cycleMs: 6200 },
  yield: { mask: BARS_MASK, variant: "bars", cycleMs: 5600 },
  sell: { mask: DOLLAR_MASK, variant: "dollar", cycleMs: 4800 },
};

export function OnboardingVisual({
  slideId,
  className,
}: {
  slideId: OnboardingSlideDef["id"];
  className?: string;
}) {
  const conf = CONFIG[slideId];
  return (
    <div
      className={cn(
        "relative mx-auto flex h-52 w-full max-w-[320px] items-center justify-center overflow-hidden",
        className,
      )}
      aria-hidden
      data-testid={`onboarding-visual-${slideId}`}
    >
      <FlipwaveGrid {...conf} cellSize={9} gap={2} />
    </div>
  );
}
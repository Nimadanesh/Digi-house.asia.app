// File responsibility: decorative slide illustrations (Fable Onboarding visuals). CSS only — no three.js.
import { CircleDollarSign, Store } from "lucide-react";
import type { OnboardingSlideDef } from "@/lib/onboarding-slides";
import { cn } from "@/lib/utils";
import { OnboardingHouseScene } from "./OnboardingHouseScene";

export function OnboardingVisual({ slideId, className }: { slideId: OnboardingSlideDef["id"]; className?: string }) {
  if (slideId === "own") {
    return (
      <div className={cn("relative mx-auto w-full", className)} data-testid="onboarding-visual-own">
        <OnboardingHouseScene />
      </div>
    );
  }

  if (slideId === "yield") {
    return (
      <div
        className={cn("relative mx-auto flex h-52 w-full max-w-[280px] items-center justify-center", className)}
        aria-hidden
        data-testid="onboarding-visual-yield"
      >
        <div className="relative flex size-36 items-center justify-center rounded-full bg-success/12 border border-success/25">
          <CircleDollarSign className="text-success" size={56} strokeWidth={1.5} />
        </div>
        <p className="absolute bottom-2 text-xs font-medium text-success tnum">Every Friday</p>
      </div>
    );
  }

  return (
    <div
      className={cn("relative mx-auto flex h-52 w-full max-w-[280px] items-center justify-center", className)}
      aria-hidden
      data-testid="onboarding-visual-sell"
    >
      <div className="relative flex size-36 items-center justify-center rounded-[20px] bg-surface-2 border border-border">
        <Store className="text-primary" size={56} strokeWidth={1.5} />
        <span className="absolute -top-2 -right-2 rounded-full bg-primary px-2 py-0.5 text-[0.625rem] font-semibold text-primary-foreground">
          Sell
        </span>
      </div>
    </div>
  );
}

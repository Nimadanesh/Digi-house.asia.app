// File responsibility: onboarding copy + slide ids (Fable Onboarding §Slides). English only.
// Slide 2 avoids “landed in your wallet” overpromise — yield is shown in-app; buy is when wallet connects.

export interface OnboardingSlideDef {
  id: "own" | "yield" | "sell";
  headline: string;
  subtitle: string;
}

export const ONBOARDING_SLIDES: readonly OnboardingSlideDef[] = [
  {
    id: "own",
    headline: "Become owner of a real property",
    subtitle: "Start from as little as $80",
  },
  {
    id: "yield",
    headline: "Receive your rental share every week",
    // MVP honesty: projected weekly yield in Earnings — real wallet deposition is post-MVP.
    subtitle: "See your share every Friday in Earnings",
  },
  {
    id: "sell",
    headline: "Sell anytime you want",
    subtitle: "List shares on the DigiHouse marketplace when you’re ready to exit.",
  },
] as const;

export const ONBOARDING_SLIDE_COUNT = ONBOARDING_SLIDES.length;

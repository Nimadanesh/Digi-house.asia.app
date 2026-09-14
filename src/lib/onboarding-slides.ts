// File responsibility: onboarding copy + slide ids (Fable Onboarding §Slides). English only.
// Slide 2 states the locked monthly income model — profit accrues monthly; the four
// weekly transfers (if used operationally) are a payment schedule, never "weekly profit".
// Buy is when the wallet connects (no "landed in your wallet" overpromise).

export interface OnboardingSlideDef {
  id: "own" | "yield" | "sell";
  headline: string;
  subtitle: string;
}

export const ONBOARDING_SLIDES: readonly OnboardingSlideDef[] = [
  {
    id: "own",
    headline: "Become owner of a real property",
    subtitle: "Start from as little as $100",
  },
  {
    id: "yield",
    headline: "Receive your rental share every month",
    // MVP honesty: projected monthly income in Earnings — real wallet deposition is post-MVP.
    subtitle: "See your monthly share in Earnings",
  },
  {
    id: "sell",
    headline: "Sell anytime you want",
    subtitle: "List shares on the FractionalLuxe marketplace when you’re ready to exit.",
  },
] as const;

export const ONBOARDING_SLIDE_COUNT = ONBOARDING_SLIDES.length;

import { describe, it, expect } from "vitest";
import { ONBOARDING_SLIDES, ONBOARDING_SLIDE_COUNT } from "@/lib/onboarding-slides";

describe("onboarding slides content", () => {
  it("has exactly 3 Fable slides", () => {
    expect(ONBOARDING_SLIDE_COUNT).toBe(3);
    expect(ONBOARDING_SLIDES).toHaveLength(3);
  });

  it("slide 1 own-property hook", () => {
    expect(ONBOARDING_SLIDES[0]!.headline).toMatch(/owner of a real property/i);
    expect(ONBOARDING_SLIDES[0]!.subtitle).toMatch(/\$80/);
  });

  it("slide 2 weekly yield without wallet overpromise", () => {
    expect(ONBOARDING_SLIDES[1]!.headline).toMatch(/rental share every week/i);
    expect(ONBOARDING_SLIDES[1]!.subtitle.toLowerCase()).not.toMatch(/landed in your wallet/);
  });

  it("slide 3 sell", () => {
    expect(ONBOARDING_SLIDES[2]!.headline).toMatch(/Sell anytime/i);
    expect(ONBOARDING_SLIDES[2]!.subtitle).toMatch(/marketplace/i);
  });
});

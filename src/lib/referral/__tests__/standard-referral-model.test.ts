import { describe, it, expect } from "vitest";
import {
  getStandardReferralReward,
  REFERRAL_REWARD_SHARE_LOCK_MONTHS,
  STANDARD_REFERRAL_BANDS,
} from "@/lib/referral/standard-referral-model";

// [investedCents, expectedRateBps | "custom", expectedRewardCents?]
const cases: Array<[number, number | "custom", number?]> = [
  [0, 500, 0],
  [500_000, 500, 25_000],
  [999_999, 500, 50_000],
  [1_000_000, 750, 75_000],
  [2_000_000, 750, 150_000],
  [2_499_999, 750, 187_500],
  [2_500_000, 1000, 250_000],
  [5_000_000, 1000, 500_000],
  [9_999_999, 1000, 1_000_000],
  [10_000_000, "custom"],
  [25_000_000, "custom"],
];

describe("standard referral model", () => {
  it("lock is 6 months", () => {
    expect(REFERRAL_REWARD_SHARE_LOCK_MONTHS).toBe(6);
  });

  it("has exactly 3 bands", () => {
    expect(STANDARD_REFERRAL_BANDS).toHaveLength(3);
  });

  it.each(cases)("invested %i → %s", (cents, rate, reward) => {
    const r = getStandardReferralReward(cents);
    if (rate === "custom") {
      expect(r.kind).toBe("custom");
      return;
    }
    expect(r).toEqual({ kind: "reward", rateBps: rate, rewardCents: reward });
  });

  it("negative input clamps to lowest band zero reward", () => {
    expect(getStandardReferralReward(-5)).toEqual({
      kind: "reward",
      rateBps: 500,
      rewardCents: 0,
    });
  });
});

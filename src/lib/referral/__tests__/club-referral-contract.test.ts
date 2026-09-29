import { describe, it, expect } from "vitest";
// Referral Hub contract against the Club V1 single source of truth
// (src/lib/club/club-economics.ts). This file asserts the ladder, stay
// mapping, qualification gate, and Plus-layer semantics the /referral Club
// view depends on — it defines no second model.
import {
  MAX_REFERRAL_STAY_NIGHTS,
  QUALIFYING_INVESTMENT_CENTS,
  REFERRAL_LADDER,
  STANDARD_AWARD_NIGHTS,
  isQualifiedReferral,
  referralProgress,
  referralStayNights,
  resolveExperienceTier,
} from "@/lib/club/club-economics";

describe("club referral contract V1 (single source: club-economics)", () => {
  it("ladder has 5 milestones: 1→1, 3→4, 5→7, 7→11, 10→16 points", () => {
    expect(REFERRAL_LADDER.map((m) => [m.referrals, m.cumulativePoints])).toEqual([
      [1, 1],
      [3, 4],
      [5, 7],
      [7, 11],
      [10, 16],
    ]);
  });

  it("base stay is 4 nights, cap is 7", () => {
    expect(STANDARD_AWARD_NIGHTS).toBe(4);
    expect(MAX_REFERRAL_STAY_NIGHTS).toBe(7);
  });

  it("qualification gate is $10K", () => {
    expect(QUALIFYING_INVESTMENT_CENTS).toBe(1_000_000);
    expect(isQualifiedReferral(999_999)).toBe(false);
    expect(isQualifiedReferral(1_000_000)).toBe(true);
  });

  it.each([
    [0, 4],
    [1, 4],
    [2, 4],
    [3, 5],
    [4, 5],
    [5, 6],
    [6, 6],
    [7, 7],
    [10, 7],
    [25, 7],
  ])("stay nights for %i referrals → %i", (count, nights) => {
    expect(referralStayNights(count)).toBe(nights);
  });

  it("progress accumulates points and exposes the next milestone", () => {
    expect(referralProgress(0)).toEqual({
      successfulReferrals: 0,
      cumulativePoints: 0,
      plusLayerUnlocked: false,
      nextMilestone: expect.objectContaining({ referrals: 1 }),
    });
    expect(referralProgress(3)).toEqual({
      successfulReferrals: 3,
      cumulativePoints: 4,
      plusLayerUnlocked: false,
      nextMilestone: expect.objectContaining({ referrals: 5 }),
    });
    const done = referralProgress(10);
    expect(done.cumulativePoints).toBe(16);
    expect(done.plusLayerUnlocked).toBe(true);
    expect(done.nextMilestone).toBeNull();
  });

  it("10 referrals unlock the experience layer without changing the financial tier", () => {
    expect(resolveExperienceTier("private", true)).toBe("private_plus");
    expect(resolveExperienceTier("private", false)).toBe("private");
    expect(resolveExperienceTier("private_plus", true)).toBe("private_plus");
    expect(resolveExperienceTier("elite", true)).toBe("elite");
    expect(resolveExperienceTier("signature", true)).toBe("signature");
    expect(resolveExperienceTier("standard", true)).toBe("standard");
  });
});

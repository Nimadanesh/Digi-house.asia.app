import { describe, it, expect } from "vitest";
import * as standard from "@/lib/referral/standard-referral-model";
import * as club from "@/lib/club/club-economics";
import { getClubStatus } from "@/lib/club/club-status";

describe("standard and club referral systems stay separated", () => {
  it("standard rewards carry no points, stays, or tiers", () => {
    const reward = standard.getStandardReferralReward(5_000_000);
    expect(reward).toEqual({ kind: "reward", rateBps: 1000, rewardCents: 500_000 });
    expect(reward).not.toHaveProperty("points");
    expect(reward).not.toHaveProperty("stay");
    expect(reward).not.toHaveProperty("tier");
    expect(Object.keys(standard).join(" ")).not.toMatch(/points|stay|tier/i);
  });

  it("club progress carries no reward credit", () => {
    const progress = club.referralProgress(5);
    expect(progress).toEqual({
      successfulReferrals: 5,
      cumulativePoints: 7,
      plusLayerUnlocked: false,
      nextMilestone: expect.objectContaining({ referrals: 7 }),
    });
    expect(progress).not.toHaveProperty("rewardCents");
    expect(progress).not.toHaveProperty("rateBps");
  });

  it("club referral state never rewrites the financial tier", () => {
    // A $12K investor stays financially PRIVATE even with the Plus layer unlocked.
    expect(getClubStatus(1_200_000).tierId).toBe("private");
    expect(club.resolveExperienceTier("private", true)).toBe("private_plus");
    expect(getClubStatus(1_200_000).tierId).toBe("private");
  });

  it("no combined referral balance exists", () => {
    const exported = [...Object.keys(standard)];
    expect(exported.join(" ")).not.toMatch(/balance|ledger|wallet|combined|total/i);
  });
});

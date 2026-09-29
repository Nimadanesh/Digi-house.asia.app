// Private Club economics v1 — approved business rules (integer arithmetic only).
import { describe, expect, it } from "vitest";

import {
  CLUB_POOL_NIGHTS,
  STANDARD_AWARD_NIGHTS,
  TIER_WEIGHTS,
  allocationMode,
  completeAwards,
  isQualifiedReferral,
  isStayEligible,
  referralProgress,
  referralStayNights,
  resolveExperienceTier,
  tierWeight,
} from "@/lib/club/club-economics";

describe("tier weights (normative V1 weights, locked 2026-09-26)", () => {
  it("private 1 / plus 1.25 / elite 1.5 / signature 2, standard 0 (ineligible)", () => {
    expect(tierWeight("private")).toBe(1);
    expect(tierWeight("private_plus")).toBe(1.25);
    expect(tierWeight("elite")).toBe(1.5);
    expect(tierWeight("signature")).toBe(2);
    expect(tierWeight("standard")).toBe(0);
    expect(TIER_WEIGHTS).toEqual({ private: 1, private_plus: 1.25, elite: 1.5, signature: 2 });
  });
});

describe("capacity (floor division, never fractional awards)", () => {
  it("1450 / 4 = 362 awards with 2 nights remainder", () => {
    expect(CLUB_POOL_NIGHTS).toBe(1450);
    expect(STANDARD_AWARD_NIGHTS).toBe(4);
    expect(completeAwards(1450, 4)).toEqual({ awards: 362, remainder: 2 });
  });

  it("remainder never becomes a fractional award", () => {
    const { awards, remainder } = completeAwards(CLUB_POOL_NIGHTS, STANDARD_AWARD_NIGHTS);
    expect(Number.isInteger(awards)).toBe(true);
    expect(awards * STANDARD_AWARD_NIGHTS + remainder).toBe(CLUB_POOL_NIGHTS);
    expect(remainder).toBeLessThan(STANDARD_AWARD_NIGHTS);
  });
});

describe("lifestyle value removal (no investment-derived experience amounts)", () => {
  it("exposes no lifestyle selector or rate constants", async () => {
    const clubModule = await import("@/lib/club/club-economics");
    const names = Object.keys(clubModule);
    expect(names.some((n) => n.toLowerCase().includes("lifestyle"))).toBe(false);
    expect("lifestyleValueCents" in clubModule).toBe(false);
  });

  it("six benefits remain intact including concierge", async () => {
    const { CLUB_BENEFITS } = await import("@/lib/club/club-benefits");
    expect(CLUB_BENEFITS.map((b) => b.id).sort()).toEqual([
      "card",
      "concierge",
      "escape",
      "priority",
      "referral",
      "villa",
    ]);
  });

  it("core economics unchanged: pool, award, weights", () => {
    expect(CLUB_POOL_NIGHTS).toBe(1450);
    expect(STANDARD_AWARD_NIGHTS).toBe(4);
    expect(TIER_WEIGHTS).toEqual({ private: 1, private_plus: 1.25, elite: 1.5, signature: 2 });
  });
});

describe("referral ladder (cumulative, plus layer at 10)", () => {
  it("0 referrals → 0 points, next milestone 1", () => {
    expect(referralProgress(0)).toEqual({
      successfulReferrals: 0,
      cumulativePoints: 0,
      plusLayerUnlocked: false,
      nextMilestone: { referrals: 1, cumulativePoints: 1, additionalNights: 0, unlocksPlusLayer: false },
    });
  });

  it.each([
    [1, 1, false],
    [3, 4, false],
    [5, 7, false],
    [7, 11, false],
    [10, 16, true],
  ])("%i referrals → %i points, plusLayer=%s", (count, points, unlocked) => {
    const p = referralProgress(count);
    expect(p.cumulativePoints).toBe(points);
    expect(p.plusLayerUnlocked).toBe(unlocked);
  });

  it("between milestones keeps the reached level", () => {
    expect(referralProgress(4).cumulativePoints).toBe(4);
    expect(referralProgress(9).cumulativePoints).toBe(11);
    expect(referralProgress(9).nextMilestone?.referrals).toBe(10);
  });

  it("past 10 keeps 16 points with no next milestone", () => {
    const p = referralProgress(12);
    expect(p.cumulativePoints).toBe(16);
    expect(p.plusLayerUnlocked).toBe(true);
    expect(p.nextMilestone).toBeNull();
  });
});

describe("referral stay enhancement (capped whole-night model)", () => {
  it.each([
    [0, 4],
    [1, 4],
    [2, 4],
    [3, 5],
    [4, 5],
    [5, 6],
    [6, 6],
    [7, 7],
    [9, 7],
    [10, 7],
    [25, 7],
  ])("%i referrals → %i-night stay", (count, nights) => {
    expect(referralStayNights(count)).toBe(nights);
  });

  it("never exceeds 7, never fractional, base is always 4", () => {
    for (let count = 0; count <= 30; count += 1) {
      const nights = referralStayNights(count);
      expect(Number.isInteger(nights)).toBe(true);
      expect(nights).toBeGreaterThanOrEqual(4);
      expect(nights).toBeLessThanOrEqual(7);
    }
  });

  it("10 referrals caps at 7 nights and unlocks the experience layer", () => {
    expect(referralStayNights(10)).toBe(7);
    expect(referralProgress(10).plusLayerUnlocked).toBe(true);
  });
});

describe("experience layer never changes the financial tier", () => {
  it.each([["standard"], ["private"], ["private_plus"], ["elite"], ["signature"]] as const)(
    "financial tier %s is preserved with and without the plus layer",
    (tierId) => {
      expect(resolveExperienceTier(tierId, false)).toBe(tierId);
      expect(resolveExperienceTier(tierId, true)).toBe(
        tierId === "private" ? "private_plus" : tierId,
      );
    },
  );

  it("only private members gain experience-layer upgrade; others keep identity", () => {
    expect(resolveExperienceTier("private", true)).toBe("private_plus");
    expect(resolveExperienceTier("elite", true)).toBe("elite");
    expect(resolveExperienceTier("standard", true)).toBe("standard");
  });
});
describe("eligibility", () => {
  it("STANDARD never participates; PRIVATE and above are eligible", () => {
    expect(isStayEligible("standard")).toBe(false);
    expect(isStayEligible("private")).toBe(true);
    expect(isStayEligible("private_plus")).toBe(true);
    expect(isStayEligible("elite")).toBe(true);
    expect(isStayEligible("signature")).toBe(true);
  });

  it("only referrals at >= $10K invested count as qualified", () => {
    expect(isQualifiedReferral(999_900)).toBe(false);
    expect(isQualifiedReferral(1_000_000)).toBe(true);
    expect(isQualifiedReferral(5_000_000)).toBe(true);
  });
});

describe("allocation mode boundary", () => {
  it("direct at/below ~360 eligible members, lottery above", () => {
    expect(allocationMode(100)).toBe("direct");
    expect(allocationMode(360)).toBe("direct");
    expect(allocationMode(361)).toBe("lottery");
    expect(allocationMode(2000)).toBe("lottery");
  });
});

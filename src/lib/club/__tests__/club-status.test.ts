// Private Club membership selector — UI prototype thresholds only.
// These tiers must NEVER feed investment/fee/yield/settlement logic.
import { describe, expect, it } from "vitest";

import { getClubStatus } from "@/lib/club/club-status";
import { getClubTierState } from "@/lib/club/club-tiers";
import { CLUB_BENEFITS, isBenefitUnlocked } from "@/lib/club/club-benefits";

describe("getClubStatus boundaries (integer cents, no float money)", () => {
  const cases = [
    { invested: 0, tier: "standard", next: "private", toNext: 1_000_000 },
    { invested: 750_000, tier: "standard", next: "private", toNext: 250_000 },
    { invested: 999_900, tier: "standard", next: "private", toNext: 100 },
    { invested: 1_000_000, tier: "private", next: "private_plus", toNext: 1_500_000 },
    { invested: 1_500_000, tier: "private", next: "private_plus", toNext: 1_000_000 },
    { invested: 2_499_900, tier: "private", next: "private_plus", toNext: 100 },
    { invested: 2_500_000, tier: "private_plus", next: "elite", toNext: 7_500_000 },
    { invested: 9_999_900, tier: "private_plus", next: "elite", toNext: 100 },
    { invested: 10_000_000, tier: "elite", next: "signature", toNext: 40_000_000 },
    { invested: 49_999_900, tier: "elite", next: "signature", toNext: 100 },
    { invested: 50_000_000, tier: "signature", next: null, toNext: null },
    { invested: 100_000_000, tier: "signature", next: null, toNext: null },
  ] as const;

  for (const c of cases) {
    it(`$${(c.invested / 100).toLocaleString()} → ${c.tier}`, () => {
      expect(getClubStatus(c.invested)).toEqual({
        tierId: c.tier,
        nextTierId: c.next,
        toNextUsdCents: c.toNext,
      });
    });
  }

  it("never reports a fake $0 to unlock below the top tier", () => {
    for (const c of cases) {
      if (c.next !== null) expect(c.toNext).toBeGreaterThan(0);
    }
  });

  it("clamps negative input to standard", () => {
    expect(getClubStatus(-100).tierId).toBe("standard");
  });

  it("floors fractional cents without float tier comparison", () => {
    expect(getClubStatus(999_999.9).tierId).toBe("standard");
    expect(getClubStatus(1_000_000.1).tierId).toBe("private");
  });
});

describe("getClubTierState (past / current / future)", () => {
  it("marks the member tier current, lower past, higher future", () => {
    expect(getClubTierState("standard", "private")).toBe("past");
    expect(getClubTierState("private", "private")).toBe("current");
    expect(getClubTierState("private_plus", "private")).toBe("future");
    expect(getClubTierState("signature", "signature")).toBe("current");
    expect(getClubTierState("elite", "signature")).toBe("past");
  });
});

describe("benefit unlock model", () => {
  it("standard is preview-only: no premium benefit unlocked", () => {
    const unlocked = CLUB_BENEFITS.filter((b) => isBenefitUnlocked(b, "standard"));
    expect(unlocked).toEqual([]);
  });

  it("private unlocks the core experience (villa, escape, priority, card, referral)", () => {
    const unlocked = CLUB_BENEFITS.filter((b) => isBenefitUnlocked(b, "private")).map((b) => b.id);
    expect(unlocked.sort()).toEqual(["card", "escape", "priority", "referral", "villa"]);
  });

  it("private_plus adds concierge", () => {
    expect(CLUB_BENEFITS.filter((b) => isBenefitUnlocked(b, "private_plus"))).toHaveLength(6);
  });

  it("exactly six benefits exist", () => {
    expect(CLUB_BENEFITS.map((b) => b.id).sort()).toEqual([
      "card",
      "concierge",
      "escape",
      "priority",
      "referral",
      "villa",
    ]);
  });
});

// Complimentary Stay Journey — domain contract tests. Staged allocation:
// preferences → estimated window → countdown → future exact allocation.
// No booking engine, no lottery, no live inventory here.
import { describe, expect, it } from "vitest";

import {
  STAY_AWARD_NIGHTS,
  allocationCountdownDays,
  confirmationDateMs,
  deriveStayStatus,
  estimateStayWindow,
  isPreferenceComplete,
  windowSeasonBands,
  type StayPreference,
} from "@/lib/club/stay-journey";

const DAY_MS = 86_400_000;
const NOW = Date.UTC(2026, 10, 1); // 2026-11-01: Sep 2027 sits beyond the 9-month boundary.

const FULL_PREFERENCE: StayPreference = {
  season: "autumn",
  month: 9,
  travelers: 2,
  occasion: "anniversary",
  composition: "couple",
  experience: "beach",
  region: "caribbean",
};

describe("eligibility", () => {
  it("private and above enter the journey; standard does not", () => {
    expect(deriveStayStatus({ tierId: "standard", preference: null, allocation: null, nowMs: NOW }).status).toBeNull();
    for (const tierId of ["private", "private_plus", "elite", "signature"] as const) {
      const s = deriveStayStatus({ tierId, preference: null, allocation: null, nowMs: NOW });
      expect(s.status).toBe("TIER_CONFIRMED");
    }
  });
});

describe("4-night benefit", () => {
  it("every stay award is exactly 4 whole nights", () => {
    expect(STAY_AWARD_NIGHTS).toBe(4);
    expect(Number.isInteger(STAY_AWARD_NIGHTS)).toBe(true);
  });
});

describe("preference flow", () => {
  it("missing preference → TIER_CONFIRMED; partial → PREFERENCES_REQUIRED", () => {
    expect(
      deriveStayStatus({ tierId: "private", preference: null, allocation: null, nowMs: NOW }).status,
    ).toBe("TIER_CONFIRMED");
    expect(isPreferenceComplete(null)).toBe(false);
    expect(isPreferenceComplete({ ...FULL_PREFERENCE, occasion: null })).toBe(false);
  });

  it("completed preferences → WAITING_FOR_ALLOCATION", () => {
    const s = deriveStayStatus({ tierId: "private", preference: FULL_PREFERENCE, allocation: null, nowMs: NOW });
    expect(s.status).toBe("WAITING_FOR_ALLOCATION");
    expect(isPreferenceComplete(FULL_PREFERENCE)).toBe(true);
  });
});

describe("estimated window (no exact dates)", () => {
  it("month preference + 9-month rule → labeled 2-month window", () => {
    const window = estimateStayWindow({ preference: FULL_PREFERENCE, referenceMs: NOW });
    expect(window.startYear).toBe(2027);
    expect(window.startMonth).toBe(9);
    expect(window.label).toBe("September–October 2027");
    expect(window.checkIn).toBeNull();
    expect(window.checkOut).toBeNull();
  });

  it("flexible preference defaults to the earliest eligible month", () => {
    const window = estimateStayWindow({
      preference: { ...FULL_PREFERENCE, season: "flexible", month: null },
      referenceMs: NOW,
    });
    // 2026-11-01 + 9 months = 2027-08-01 → August–September 2027.
    expect(window.startYear).toBe(2027);
    expect(window.startMonth).toBe(8);
    expect(window.label).toBe("August–September 2027");
  });

  it("season preference rolls into the next year when passed", () => {
    const window = estimateStayWindow({
      preference: { ...FULL_PREFERENCE, season: "spring", month: null },
      referenceMs: NOW,
    });
    expect(window.startYear).toBe(2028);
    expect(window.startMonth).toBe(3);
  });
});

describe("exact allocation contract", () => {
  it("before allocation every exact field is null", () => {
    const s = deriveStayStatus({ tierId: "private", preference: FULL_PREFERENCE, allocation: null, nowMs: NOW });
    expect(s.allocation.villaId).toBeNull();
    expect(s.allocation.checkIn).toBeNull();
    expect(s.allocation.checkOut).toBeNull();
    expect(s.allocation.nights).toBe(STAY_AWARD_NIGHTS);
  });

  it("populated allocation resolves ALLOCATED with 4 nights", () => {
    const s = deriveStayStatus({
      tierId: "private",
      preference: FULL_PREFERENCE,
      allocation: { villaId: "re-128862", checkIn: "2027-09-14", checkOut: "2027-09-18", nights: 4 },
      nowMs: NOW,
    });
    expect(s.status).toBe("ALLOCATED");
    expect(s.allocation.nights).toBe(4);
  });
});

describe("countdown (allocation confirmation timing, not vacation start)", () => {
  it("counts whole days until confirmation, floored at zero", () => {
    expect(allocationCountdownDays({ confirmationMs: NOW + 42 * DAY_MS, nowMs: NOW })).toBe(42);
    expect(allocationCountdownDays({ confirmationMs: NOW - DAY_MS, nowMs: NOW })).toBe(0);
  });

  it("confirmation derives from the window start minus lead time", () => {
    const window = estimateStayWindow({ preference: FULL_PREFERENCE, referenceMs: NOW });
    const confirmation = confirmationDateMs(window, 60);
    expect(confirmation).toBeLessThan(Date.UTC(2027, 8, 1));
  });

  it("past confirmation with no allocation → ALLOCATION_PENDING, not dates", () => {
    const window = estimateStayWindow({ preference: FULL_PREFERENCE, referenceMs: NOW });
    const s = deriveStayStatus({
      tierId: "private",
      preference: FULL_PREFERENCE,
      allocation: null,
      nowMs: Date.UTC(2027, 9, 1),
      window,
    });
    expect(s.status).toBe("ALLOCATION_PENDING");
    expect(s.allocation.checkIn).toBeNull();
  });
});

describe("season integration", () => {
  it("window bands resolve through the researched season calendar", () => {
    const bands = windowSeasonBands("re-128862", 9);
    expect(bands).toContain("off_peak");
    expect(windowSeasonBands("re-130901", 1)).toContain("high");
    expect(windowSeasonBands("unknown-id", 9)).toBeNull();
  });
});

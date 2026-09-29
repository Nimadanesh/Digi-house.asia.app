// Season calendar structural validation — asserts research conclusions'
// shape, never invented dates. Specific dates live in season-calendar.ts
// with per-period sources; tests pin invariants around them.
import { describe, expect, it } from "vitest";

import {
  VILLA_SEASON_CALENDARS,
  getVillaSeasonCalendar,
  isClubPreferred,
  periodDayCount,
  seasonDayCounts,
  seasonOnDate,
  type SeasonBand,
} from "@/lib/club/season-calendar";

const BANDS: SeasonBand[] = ["peak", "high", "shoulder", "off_peak"];

describe("season calendar registry", () => {
  it("covers all 24 canonical villas with unique property IDs", () => {
    expect(VILLA_SEASON_CALENDARS).toHaveLength(24);
    const ids = VILLA_SEASON_CALENDARS.map((c) => c.propertyId);
    expect(new Set(ids).size).toBe(24);
    for (const c of VILLA_SEASON_CALENDARS) {
      expect(c.propertyId).toMatch(/^re-[0-9]+$/);
      expect(c.propertyName.length).toBeGreaterThan(0);
      expect(c.location.length).toBeGreaterThan(0);
      expect(c.listingId.length).toBeGreaterThan(0);
    }
  });

  it("lookup returns the villa or null for unknown ids", () => {
    expect(getVillaSeasonCalendar("re-128862")?.propertyName).toContain("JOALI");
    expect(getVillaSeasonCalendar("nope")).toBeNull();
  });

  it("every period uses valid seasons, MM-DD dates, sources and confidence", () => {
    for (const cal of VILLA_SEASON_CALENDARS) {
      expect(cal.periods.length).toBeGreaterThan(0);
      for (const period of cal.periods) {
        expect(BANDS).toContain(period.season);
        expect(period.start).toMatch(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/);
        expect(period.end).toMatch(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/);
        expect(period.reason.length).toBeGreaterThan(0);
        expect(["HIGH", "MEDIUM", "LOW"]).toContain(period.confidence);
        expect(period.sources.length).toBeGreaterThan(0);
      }
      expect(["RESEARCHED", "PARTIAL", "UNKNOWN"]).toContain(cal.researchStatus);
    }
  });

  it("periods are non-overlapping and cover the full 365-day calendar", () => {
    for (const cal of VILLA_SEASON_CALENDARS) {
      const counts = seasonDayCounts(cal.periods);
      const total = counts.peak + counts.high + counts.shoulder + counts.off_peak;
      expect(total).toBe(365);
      // Spot-check every month start resolves to exactly one band (no gaps).
      for (let m = 1; m <= 12; m++) {
        const mmdd = `${String(m).padStart(2, "0")}-15`;
        expect(seasonOnDate(cal.periods, mmdd)).not.toBeNull();
      }
    }
  });

  it("year-spanning festive peak resolves on both sides of New Year", () => {
    expect(periodDayCount("12-20", "01-07")).toBe(19);
    expect(periodDayCount("06-01", "10-31")).toBe(153);
    const maldives = getVillaSeasonCalendar("re-128862")!;
    expect(seasonOnDate(maldives.periods, "12-25")).toBe("peak");
    expect(seasonOnDate(maldives.periods, "01-03")).toBe("peak");
    expect(seasonOnDate(maldives.periods, "07-15")).toBe("off_peak");
  });

  it("Feb 29 resolves to the March-1 period (365-day non-leap model)", () => {
    const maldives = getVillaSeasonCalendar("re-128862")!;
    expect(seasonOnDate(maldives.periods, "02-29")).toBe(seasonOnDate(maldives.periods, "03-01"));
    expect(seasonOnDate(maldives.periods, "02-29")).toBe("high");
  });

  it("season registry identities match the canonical 24-estate registry", async () => {
    const { CANONICAL_MARKETPLACE_ESTATES } = await import(
      "@/lib/economics/estates/canonical-24"
    );
    const canonicalIds = new Set(CANONICAL_MARKETPLACE_ESTATES.map((e) => e.propertyId));
    expect(canonicalIds.size).toBe(24);
    const seasonIds = new Set(VILLA_SEASON_CALENDARS.map((c) => c.propertyId));
    expect(seasonIds).toEqual(canonicalIds);
    const canonicalById = new Map(CANONICAL_MARKETPLACE_ESTATES.map((e) => [e.propertyId, e]));
    for (const cal of VILLA_SEASON_CALENDARS) {
      const canonical = canonicalById.get(cal.propertyId)!;
      expect(cal.propertyName).toBe(canonical.name.value);
      expect(cal.location).toBe(canonical.location.value);
      expect(cal.listingId).toBe(canonical.rentalEscapesListingId);
    }
  });
});

describe("club preference logic", () => {
  it("off-peak is always preferred; peak/high never are", () => {
    expect(isClubPreferred("off_peak")).toBe(true);
    expect(isClubPreferred("peak")).toBe(false);
    expect(isClubPreferred("high")).toBe(false);
    expect(isClubPreferred("shoulder")).toBe(false);
    expect(isClubPreferred("shoulder", { includeShoulder: true })).toBe(true);
  });

  it("every villa exposes off-peak inventory (peak is never the whole year)", () => {
    for (const cal of VILLA_SEASON_CALENDARS) {
      if (cal.propertyId === "re-129549") continue; // LA: high year-round, flagged PARTIAL
      expect(seasonDayCounts(cal.periods).off_peak).toBeGreaterThan(0);
    }
  });
});

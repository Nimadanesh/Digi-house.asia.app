// File responsibility: Complimentary Stay Journey — domain contract + pure
// selectors for the staged allocation journey (preferences → estimated window
// → countdown → future exact allocation). No booking engine, no lottery, no
// live inventory, no settlement. Prototype state lives in a zustand store;
// date math is deterministic via injected timestamps (integer days).
import { isStayEligible } from "./club-economics";
import { getVillaSeasonCalendar, seasonOnDate, type SeasonBand } from "./season-calendar";
import type { ClubTierId } from "./club-tiers";

/** Standard complimentary stay: exactly 4 whole nights, never fractional. */
export const STAY_AWARD_NIGHTS = 4;
/** Planning boundary: complimentary redemption starts this many months out. */
export const STAY_MIN_MONTHS_OUT = 9;
/** Days before the window start when exact dates are confirmed. */
export const ALLOCATION_LEAD_DAYS = 60;
/** Within this many days of confirmation the journey reads as approaching. */
export const ALLOCATION_APPROACHING_DAYS = 14;

export type StayStatus =
  | "TIER_CONFIRMED"
  | "PREFERENCES_REQUIRED"
  | "WAITING_FOR_ALLOCATION"
  | "ALLOCATION_PENDING"
  | "ALLOCATED";

export type StaySeasonPref = "spring" | "summer" | "autumn" | "winter" | "flexible";
export type StayOccasion =
  | "anniversary"
  | "proposal"
  | "valentine"
  | "birthday"
  | "honeymoon"
  | "family"
  | "getaway"
  | "other";
export type StayComposition = "couple" | "family" | "friends" | "solo";
export type StayExperience =
  | "beach"
  | "nature"
  | "privacy"
  | "adventure"
  | "romance"
  | "wellness"
  | "culture"
  | "family";
export type StayRegion =
  | "caribbean"
  | "mediterranean"
  | "indian_ocean"
  | "europe"
  | "americas"
  | "no_preference";

export interface StayPreference {
  season: StaySeasonPref | null;
  /** 1–12, or null for no month preference. */
  month: number | null;
  /** 1–4, or 5 meaning "5+". Count only, never a booking guarantee. */
  travelers: number | null;
  occasion: StayOccasion | null;
  composition: StayComposition | null;
  experience: StayExperience | null;
  region: StayRegion | null;
}

export interface StayAllocation {
  villaId: string | null;
  checkIn: string | null;
  checkOut: string | null;
  nights: number;
}

export interface EstimatedStayWindow {
  startYear: number;
  /** 1–12. */
  startMonth: number;
  /** Localised "Month–Month YYYY" label; never exact dates. */
  label: string;
  checkIn: null;
  checkOut: null;
}

export interface StayJourneyState {
  status: StayStatus | null;
  allocation: StayAllocation;
}

/** Complete when every preference dimension is answered. */
export function isPreferenceComplete(preference: StayPreference | null): boolean {
  if (!preference) return false;
  return (
    preference.season !== null &&
    preference.travelers !== null &&
    preference.occasion !== null &&
    preference.composition !== null &&
    preference.experience !== null &&
    preference.region !== null
  );
}

const SEASON_MONTHS: Record<Exclude<StaySeasonPref, "flexible">, number[]> = {
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  autumn: [9, 10, 11],
  winter: [12, 1, 2],
};

function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en", { month: "long", timeZone: "UTC" });
}

/**
 * Approximate 2-month stay window from preferences + the 9-month planning
 * boundary. Deterministic in `referenceMs`. Never yields exact dates.
 */
export function estimateStayWindow({
  preference,
  referenceMs,
  minMonthsOut = STAY_MIN_MONTHS_OUT,
}: {
  preference: StayPreference;
  referenceMs: number;
  minMonthsOut?: number;
}): EstimatedStayWindow {
  const ref = new Date(referenceMs);
  const earliest = addMonths(ref.getUTCFullYear(), ref.getUTCMonth() + 1, minMonthsOut);

  let start = earliest;
  if (preference.month !== null && preference.month >= 1 && preference.month <= 12) {
    let candidate = { year: earliest.year, month: preference.month };
    if (candidate.year < earliest.year || (candidate.year === earliest.year && candidate.month < earliest.month)) {
      candidate = { year: earliest.year + 1, month: preference.month };
    }
    start = candidate;
  } else if (preference.season !== null && preference.season !== "flexible") {
    const months = SEASON_MONTHS[preference.season];
    for (let yearOffset = 0; yearOffset < 2; yearOffset += 1) {
      const found = months.find(
        (m) =>
          earliest.year + yearOffset > earliest.year ||
          (earliest.year + yearOffset === earliest.year && m >= earliest.month),
      );
      if (found !== undefined) {
        start = { year: earliest.year + yearOffset, month: found };
        break;
      }
    }
  }

  const end = addMonths(start.year, start.month, 1);
  const endYear = end.month === 1 ? start.year + 1 : start.year;
  return {
    startYear: start.year,
    startMonth: start.month,
    label: `${monthLabel(start.year, start.month)}–${monthLabel(endYear, end.month)} ${endYear}`,
    checkIn: null,
    checkOut: null,
  };
}

/** First day of the window start month (UTC ms) for countdown anchoring. */
export function windowStartMs(window: EstimatedStayWindow): number {
  return Date.UTC(window.startYear, window.startMonth - 1, 1);
}

/** Confirmation moment: window start minus lead time. Countdown target, not vacation start. */
export function confirmationDateMs(window: EstimatedStayWindow, leadDays = ALLOCATION_LEAD_DAYS): number {
  return windowStartMs(window) - leadDays * 86_400_000;
}

/** Whole days until confirmation, floored at zero. */
export function allocationCountdownDays({
  confirmationMs,
  nowMs,
}: {
  confirmationMs: number;
  nowMs: number;
}): number {
  return Math.max(0, Math.ceil((confirmationMs - nowMs) / 86_400_000));
}

/** Season band(s) covering a villa's given month, via the researched calendar. */
export function windowSeasonBands(villaId: string, month: number): SeasonBand[] | null {
  const calendar = getVillaSeasonCalendar(villaId);
  if (!calendar || month < 1 || month > 12) return null;
  const bands = new Set<SeasonBand>();
  for (const day of [1, 15, 28]) {
    const band = seasonOnDate(
      calendar.periods,
      `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );
    if (band) bands.add(band);
  }
  return bands.size > 0 ? [...bands] : null;
}

/**
 * Derive journey status. Standard tier never enters (null). Allocation with
 * complete exact fields resolves ALLOCATED; otherwise the staged states apply.
 * Past-confirmation without allocation reads ALLOCATION_PENDING — still no dates.
 */
export function deriveStayStatus({
  tierId,
  preference,
  allocation,
  nowMs,
  window,
}: {
  tierId: ClubTierId;
  preference: StayPreference | null;
  allocation: StayAllocation | null;
  nowMs: number;
  window?: EstimatedStayWindow;
}): StayJourneyState {
  const empty: StayAllocation = { villaId: null, checkIn: null, checkOut: null, nights: STAY_AWARD_NIGHTS };
  if (!isStayEligible(tierId)) return { status: null, allocation: empty };
  if (
    allocation &&
    allocation.villaId &&
    allocation.checkIn &&
    allocation.checkOut &&
    allocation.nights === STAY_AWARD_NIGHTS
  ) {
    return { status: "ALLOCATED", allocation };
  }
  if (!preference) return { status: "TIER_CONFIRMED", allocation: empty };
  if (!isPreferenceComplete(preference)) return { status: "PREFERENCES_REQUIRED", allocation: empty };
  const confirmationMs = window ? confirmationDateMs(window) : undefined;
  if (confirmationMs !== undefined && nowMs >= confirmationMs - ALLOCATION_APPROACHING_DAYS * 86_400_000) {
    return { status: "ALLOCATION_PENDING", allocation: empty };
  }
  return { status: "WAITING_FOR_ALLOCATION", allocation: empty };
}

/**
 * Unavailable-state helpers (PHASE-9-IMPLEMENTATION-CONTRACT Slice 1; UI Mapping §13).
 *
 * Minimal, convention-following helpers for honest Phase 9 states: Data pending,
 * Not yet reported, unavailable/disabled. No large abstraction layer — these are
 * pure functions a screen can call to decide WHAT to render, never fabricating values.
 */

/** Canonical availability for a data-driven surface. */
export type DataAvailability = "available" | "partial" | "unavailable";

/** Canonical reason a surface lacks data. Drives UI copy; never fabricated. */
export type UnavailableReason =
  | "not_published" // the estate's program/report has not been published
  | "no_entitlement" // the user holds no qualifying ownership
  | "backend_absent" // no data source exists yet
  | "not_reported"; // source exists but has not reported this metric

/** The exact copy vocabulary Phase 9 screens must use (UI Mapping §13). */
export type UnavailableLabel = "Data pending" | "Not yet reported" | "Unavailable";

/**
 * Resolve the honest label for an unavailable surface. UI renders this label (or
 * hides the element) — never a zero, placeholder number, or fabricated badge.
 */
export function unavailableLabel(reason: UnavailableReason): UnavailableLabel {
  switch (reason) {
    case "not_reported":
      return "Not yet reported";
    case "not_published":
    case "backend_absent":
      return "Data pending";
    case "no_entitlement":
      return "Unavailable";
  }
}

/**
 * Whether a metric may render a value. Only `available` surfaces render values;
 * `partial` surfaces render only the fields their real source provides, so this
 * returns false for partial as well — callers check field-level presence separately.
 */
export function canRenderValue(availability: DataAvailability): boolean {
  return availability === "available";
}

/**
 * Whether an action (CTA/button) may be enabled. Disabled actions still render —
 * with an honest tooltip — per the contract's "visible, honest, non-functional" rule.
 */
export function canEnableAction(availability: DataAvailability): boolean {
  return availability === "available";
}

/** Build an honest unavailable descriptor for a surface with no real data. */
export function unavailableState(
  reason: UnavailableReason = "backend_absent",
): { availability: DataAvailability; reason: UnavailableReason; label: UnavailableLabel } {
  return { availability: "unavailable", reason, label: unavailableLabel(reason) };
}

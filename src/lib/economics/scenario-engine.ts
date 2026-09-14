// File responsibility: canonical Scenario Engine (Phase 9 Rebuild Slice B).
// An ORCHESTRATION layer above the EconomicModel (Slice A). It introduces ZERO
// economic arithmetic: every number in a ScenarioResult comes from
// `computeEstateEconomics` (the single source of truth) or is bookkeeping
// (resolution records, ids, kinds).
//
// Rules encoded (Slice B contract):
// - Baseline = the Estate's explicitly configured point inputs (baselineScenario).
//   No midpoint is invented; if the estate's ADR/occupancy are unknown the Economic
//   Model's own semantics apply (zero revenue / unknown lines — honest, not guessed).
// - Omitted ScenarioInput fields are inherited; provided fields override for that
//   evaluation only. The Estate object is NEVER mutated (fresh contexts only).
// - Occupancy is validated 0..1 (no silent clamping); missing required inputs produce
//   explicit errors, not fabricated values.
// - Envelope evaluation keeps the explicit lower/upper bounds distinct — never a
//   midpoint. Bounds are passed through the EconomicModel unchanged.
// - Structural rates (17%/10%/$12/18%/12.5%/1.5%/40%/60%/18%) are EconomicModel
//   product constants; ScenarioEngine never touches them.
// - Deterministic: same Estate + ScenarioInput → identical ScenarioResult. No random,
//   no clock, no noise.
// - Legacy APY/ROI/yield logic is NOT used and NOT revived.

import type {
  Estate,
  EstateScenario,
} from "@/types/estate";
import type {
  NamedScenarioDefinition,
  ScenarioEnvelopeResult,
  ScenarioInput,
  ScenarioResolution,
  ScenarioResult,
  ScenarioValue,
} from "@/types/estate-scenario";
import { computeEstateEconomics } from "./estate-economics";

// ---------------------------------------------------------------------------
// Validation (edge-case semantics — explicit, never clamped, never guessed)
// ---------------------------------------------------------------------------

/**
 * Occupancy must be a finite number in 0..1. Outside → explicit RangeError
 * (no silent clamping). Missing → explicit Error; the engine never fabricates one.
 */
function requireValidOccupancy(occupancyRate: number | undefined): number {
  if (occupancyRate == null || !Number.isFinite(occupancyRate)) {
    throw new Error("scenario occupancyRate is missing or not a finite number");
  }
  if (occupancyRate < 0 || occupancyRate > 1) {
    throw new RangeError(`scenario occupancyRate out of range (0..1): ${occupancyRate}`);
  }
  return occupancyRate;
}

/**
 * ADR must be a finite positive number of minor units. Missing/unknown → explicit
 * Error (the engine never guesses an ADR, not even from the nightly range).
 */
function requireValidAdr(adrUsd: number | undefined): number {
  if (adrUsd == null || !Number.isFinite(adrUsd) || adrUsd <= 0) {
    throw new Error("scenario adrUsd is missing, unknown, or not a positive number");
  }
  return adrUsd;
}

/**
 * Guests, when provided, must be a non-negative integer. `null` is a deliberate
 * UNKNOWN (keeps Slice A's honest unknown green tax); `undefined` means inherit.
 * Fractional/negative guest counts are rejected — never silently floored.
 */
function resolveGuests(averageOccupiedGuests: number | null | undefined, inherited: number | null): number | null {
  if (averageOccupiedGuests === undefined) return inherited;
  if (averageOccupiedGuests === null) return null;
  if (!Number.isInteger(averageOccupiedGuests) || averageOccupiedGuests < 0) {
    throw new RangeError(`invalid averageOccupiedGuests: ${averageOccupiedGuests}`);
  }
  return averageOccupiedGuests;
}

// ---------------------------------------------------------------------------
// Derived calculation context (pure — the Estate is never mutated)
// ---------------------------------------------------------------------------

/**
 * Resolve the effective operating context for one evaluation: inherited canonical
 * values for omitted fields, caller assumptions for provided fields. Produces a FRESH
 * `EstateScenario` — nothing is written back to the Estate.
 */
function resolveScenario(estate: Estate, input: ScenarioInput): {
  scenario: EstateScenario;
  resolution: ScenarioResolution;
} {
  const inheritedOccupancy = estate.baselineScenario.occupancyRate;
  const inheritedAdr = estate.baselineScenario.adrUsd.provenance === "unknown"
    ? undefined
    : estate.baselineScenario.adrUsd.value;
  const inheritedGuests = estate.baselineScenario.averageOccupiedGuests;

  const occupancyRate = requireValidOccupancy(input.occupancyRate?.value ?? inheritedOccupancy);
  const adrUsd = requireValidAdr(input.adrUsd?.value ?? inheritedAdr);
  const averageOccupiedGuests = resolveGuests(input.averageOccupiedGuests, inheritedGuests);

  return {
    scenario: {
      adrUsd: {
        value: adrUsd,
        provenance: input.adrUsd?.provenance ?? estate.baselineScenario.adrUsd.provenance,
      },
      occupancyRate,
      averageOccupiedGuests,
    },
    resolution: {
      occupancyRate: {
        source: input.occupancyRate ? "overridden" : "inherited",
        value: occupancyRate,
      },
      adrUsd: {
        source: input.adrUsd ? "overridden" : "inherited",
        value: adrUsd,
      },
      averageOccupiedGuests: {
        source: input.averageOccupiedGuests === undefined ? "inherited" : "overridden",
        value: averageOccupiedGuests,
      },
    },
  };
}

/** Assemble a ScenarioResult around the EconomicModel output (composition only). */
function buildResult(
  estate: Estate,
  kind: ScenarioResult["kind"],
  bound: ScenarioResult["bound"],
  resolved: ReturnType<typeof resolveScenario>,
  meta: { id?: string; label?: string },
): ScenarioResult {
  return {
    id: meta.id,
    label: meta.label,
    kind,
    bound,
    resolution: resolved.resolution,
    currency: estate.asset.currency,
    economics: computeEstateEconomics(estate, resolved.scenario),
  };
}

// ---------------------------------------------------------------------------
// Public evaluation API
// ---------------------------------------------------------------------------

/**
 * THE one canonical scenario evaluation. Routes EVERYTHING through the EconomicModel.
 * `kind` defaults to "point" when the caller supplies input overrides and to
 * "baseline" otherwise; envelope helpers pass an explicit `bound`, which makes the
 * evaluation an "envelopeBound" kind.
 */
export function evaluateScenario(
  estate: Estate,
  input: ScenarioInput = {},
  meta: { id?: string; label?: string; bound?: ScenarioResult["bound"] } = {},
): ScenarioResult {
  const resolved = resolveScenario(estate, input);
  const hasOverrides =
    input.occupancyRate != null || input.adrUsd != null || input.averageOccupiedGuests !== undefined;
  const kind: ScenarioResult["kind"] = meta.bound
    ? "envelopeBound"
    : hasOverrides
      ? "point"
      : "baseline";
  return buildResult(estate, kind, meta.bound ?? null, resolved, meta);
}

/**
 * Baseline evaluation: the Estate's explicitly configured point inputs. NOT a midpoint
 * derivation — the canonical baselineScenario is used verbatim (unknown stays unknown).
 */
export function evaluateBaselineScenario(estate: Estate, meta: { id?: string; label?: string } = {}): ScenarioResult {
  return buildResult(estate, "baseline", null, resolveScenario(estate, {}), meta);
}

/**
 * Evaluate a named, configuration-defined scenario. No defaults exist in the engine:
 * naming is meaningful only because the caller's configuration supplies it.
 */
export function evaluateNamedScenario(estate: Estate, named: NamedScenarioDefinition): ScenarioResult {
  return evaluateScenario(estate, named.input, { id: named.id, label: named.label });
}

/**
 * Envelope evaluation over the estate's EXPLICIT occupancy bounds (or the caller's
 * explicit bounds). Both bounds go through the EconomicModel independently and both
 * results are returned — never collapsed, never mid-pointed.
 */
export function evaluateOccupancyEnvelope(
  estate: Estate,
  bounds?: { lower: number; upper: number },
  extra: Pick<ScenarioInput, "adrUsd" | "averageOccupiedGuests"> = {},
): ScenarioEnvelopeResult {
  const lower: number = bounds?.lower ?? estate.asset.occupancyRateMin.value;
  const upper: number = bounds?.upper ?? estate.asset.occupancyRateMax.value;
  const lowerValue: ScenarioValue = { value: lower, provenance: "estimated" };
  const upperValue: ScenarioValue = { value: upper, provenance: "estimated" };

  return {
    lower: evaluateScenario(estate, { ...extra, occupancyRate: lowerValue }, { label: "Lower bound", bound: "lower" }),
    upper: evaluateScenario(estate, { ...extra, occupancyRate: upperValue }, { label: "Upper bound", bound: "upper" }),
  };
}

/**
 * Envelope evaluation over the estate's EXPLICIT nightly-rate bounds. ADR min/max are
 * evaluated as two independent point scenarios through the EconomicModel — never
 * averaged. (Nightly min/max are ADR bounds per the EconomicModel's ADR semantics.)
 */
export function evaluateAdrEnvelope(
  estate: Estate,
  bounds?: { lower: number; upper: number },
  extra: Pick<ScenarioInput, "occupancyRate" | "averageOccupiedGuests"> = {},
): ScenarioEnvelopeResult {
  const lower: number = bounds?.lower ?? estate.asset.nightlyRateMin.value;
  const upper: number = bounds?.upper ?? estate.asset.nightlyRateMax.value;
  const lowerValue: ScenarioValue = { value: lower, provenance: "estimated" };
  const upperValue: ScenarioValue = { value: upper, provenance: "estimated" };

  return {
    lower: evaluateScenario(estate, { ...extra, adrUsd: lowerValue }, { label: "Lower bound", bound: "lower" }),
    upper: evaluateScenario(estate, { ...extra, adrUsd: upperValue }, { label: "Upper bound", bound: "upper" }),
  };
}

// Re-export for one-stop imports by future layers (ViewModel/UI) without widening
// the canonical surface beyond the EconomicModel's own exports.
export { computeEstateEconomics } from "./estate-economics";

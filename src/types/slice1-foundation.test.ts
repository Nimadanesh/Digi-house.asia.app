import { describe, expect, it } from "vitest";
import { unavailableStay, type StayUnavailableReason } from "@/types/stay";
import { isVerified, type EstateVerification } from "@/types/verification";
import {
  INCOME_STATUS_SEMANTICS,
  isExpected,
  isProjected,
  type IncomeStatus,
} from "@/types/income-status";
import {
  canEnableAction,
  canRenderValue,
  unavailableLabel,
  unavailableState,
} from "@/lib/availability";

describe("verification foundation (Slice 1 A)", () => {
  it("renders a badge only for verified estates that carry a real date", () => {
    const verified: EstateVerification = { status: "verified", lastVerifiedAt: "2026-08-01" };
    expect(isVerified(verified)).toBe(true);
  });

  it("never fabricates a badge for pending or unverified estates", () => {
    expect(isVerified({ status: "pending", lastVerifiedAt: null })).toBe(false);
    expect(isVerified({ status: "unverified", lastVerifiedAt: null })).toBe(false);
  });

  it("rejects a 'verified' state whose date is missing — that combination is a lie", () => {
    // A missing date on a verified claim must not pass the guard: the UI would
    // render a badge with nothing to show for it.
    expect(isVerified({ status: "verified", lastVerifiedAt: null })).toBe(false);
    expect(isVerified(undefined)).toBe(false);
    expect(isVerified(null)).toBe(false);
  });
});

describe("owner stay foundation (Slice 1 B)", () => {
  it("resolves to an honest unavailable snapshot with no fabricated numbers", () => {
    const stay = unavailableStay("backend_absent");
    expect(stay.availability).toBe("unavailable");
    expect(stay.unavailableReason).toBe("backend_absent");
    expect(stay.entitlement.annualNights).toBeNull();
    expect(stay.entitlement.nightsUsed).toBeNull();
    expect(stay.entitlement.nightsRemaining).toBeNull();
    expect(stay.entitlement.bookingWindowDays).toBeNull();
    expect(stay.entitlement.blackoutDates).toBeNull();
    expect(stay.entitlement.minStayNights).toBeNull();
  });

  it("carries no bookable capability — the type has no request/booking surface", () => {
    const stay = unavailableStay();
    // The snapshot exposes only descriptive fields; nothing actionable exists.
    expect(Object.keys(stay).sort()).toEqual(["availability", "entitlement", "unavailableReason"]);
  });

  it("keeps every reason distinct so the UI copy stays honest", () => {
    const reasons: StayUnavailableReason[] = ["not_published", "no_entitlement", "backend_absent"];
    expect(new Set(reasons).size).toBe(reasons.length);
  });
});

describe("income status semantics (Slice 1 D)", () => {
  it("keeps Paid, Accrued, Expected and Projected distinct", () => {
    const statuses: IncomeStatus[] = ["paid", "accrued", "expected", "projected"];
    expect(new Set(statuses).size).toBe(statuses.length);
    expect(Object.keys(INCOME_STATUS_SEMANTICS).sort()).toEqual([
      "accrued",
      "expected",
      "paid",
      "projected",
    ]);
  });

  it("treats Expected and Projected as different things", () => {
    expect(isExpected("expected")).toBe(true);
    expect(isProjected("expected")).toBe(false);
    expect(isProjected("projected")).toBe(true);
    expect(isExpected("projected")).toBe(false);
    expect(INCOME_STATUS_SEMANTICS.expected.label).not.toBe(
      INCOME_STATUS_SEMANTICS.projected.label,
    );
  });

  it("never implies guaranteed income — only Paid is settled with an always-shown date", () => {
    expect(INCOME_STATUS_SEMANTICS.paid.showDate).toBe("always");
    expect(INCOME_STATUS_SEMANTICS.accrued.showDate).toBe("if_source_provides");
    expect(INCOME_STATUS_SEMANTICS.expected.showDate).toBe("if_source_provides");
    // Projected dates may only come from a real source.
    expect(INCOME_STATUS_SEMANTICS.projected.showDate).toBe("only_projected_date_from_source");
  });
});

describe("unavailable-state helpers (Slice 1 C)", () => {
  it("maps reasons to the canonical Phase 9 copy", () => {
    expect(unavailableLabel("not_reported")).toBe("Not yet reported");
    expect(unavailableLabel("not_published")).toBe("Data pending");
    expect(unavailableLabel("backend_absent")).toBe("Data pending");
    expect(unavailableLabel("no_entitlement")).toBe("Unavailable");
  });

  it("only renders values and enables actions for available surfaces", () => {
    expect(canRenderValue("available")).toBe(true);
    expect(canRenderValue("partial")).toBe(false);
    expect(canRenderValue("unavailable")).toBe(false);
    expect(canEnableAction("available")).toBe(true);
    expect(canEnableAction("unavailable")).toBe(false);
  });

  it("builds an honest unavailable descriptor without inventing data", () => {
    const state = unavailableState("backend_absent");
    expect(state).toEqual({
      availability: "unavailable",
      reason: "backend_absent",
      label: "Data pending",
    });
  });
});

/**
 * Income status semantic contract (PHASE-9-IMPLEMENTATION-CONTRACT §4).
 *
 * Single source of meaning for all Income surfaces. `Expected !== Projected`:
 * Expected is a pending distribution from a real schedule/source; Projected is a
 * forward-looking calculation from estate economics/assumptions. No status implies
 * guaranteed income. Display helpers in `@/lib/income-display` must consume these —
 * never raw status strings.
 *
 * This is a presentation/semantic layer ONLY. It does not alter payout scheduling,
 * accrual logic, yield math, or withdrawal calculations (contract §3.2), and the
 * weekly-code-vs-monthly-model conflict remains documented and unresolved.
 */

/** Distinct income statuses — never treated as synonyms. */
export type IncomeStatus = "paid" | "accrued" | "expected" | "projected";

/** Per-status display contract (contract §4 table). */
export interface IncomeStatusSemantics {
  status: IncomeStatus;
  /** Human label. Never implies guaranteed income. */
  label: string;
  /** Whether an amount may be shown (all four allow amounts). */
  showAmount: boolean;
  /** Whether a date may be shown, and under what condition. */
  showDate: "always" | "if_source_provides" | "only_projected_date_from_source" | "never";
}

export const INCOME_STATUS_SEMANTICS: Record<IncomeStatus, IncomeStatusSemantics> = {
  paid: {
    status: "paid",
    label: "Paid",
    showAmount: true,
    showDate: "always",
  },
  accrued: {
    status: "accrued",
    label: "Accrued",
    showAmount: true,
    showDate: "if_source_provides",
  },
  expected: {
    status: "expected",
    label: "Expected",
    showAmount: true,
    showDate: "if_source_provides",
  },
  projected: {
    status: "projected",
    label: "Projected",
    showAmount: true,
    showDate: "only_projected_date_from_source",
  },
};

/**
 * An income event/figure carrying its semantic status. Amounts stay in integer
 * minor units per repository convention.
 */
export interface IncomeFigure {
  status: IncomeStatus;
  amountUsd: number;
  /** ISO date; presence governed by the status's showDate rule. */
  date: string | null;
}

/** Type guard distinguishing the two schedule-adjacent statuses. */
export function isExpected(s: IncomeStatus): s is "expected" {
  return s === "expected";
}

export function isProjected(s: IncomeStatus): s is "projected" {
  return s === "projected";
}

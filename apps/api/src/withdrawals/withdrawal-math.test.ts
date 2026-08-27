import { describe, expect, it } from "vitest";
import { WITHDRAWAL_FEE_BPS, WITHDRAWAL_INSTALLMENT_COUNT } from "./withdrawal-constants.js";
import { planWithdrawal } from "./withdrawal-math.js";

describe("planWithdrawal — locked model (1% fee, exactly 4 weekly installments)", () => {
  it("charges exactly 1% and pays the net in 4 installments summing to the net", () => {
    // $48.00 → 48¢ fee → $47.52 net → 4 × 1_188.
    const plan = planWithdrawal(4_800);
    expect(WITHDRAWAL_FEE_BPS).toBe(100);
    expect(plan.feeUsd).toBe(48);
    expect(plan.netUsd).toBe(4_752);
    expect(plan.installments).toEqual([1_188, 1_188, 1_188, 1_188]);
    expect(WITHDRAWAL_INSTALLMENT_COUNT).toBe(4);
    expect(plan.installments.reduce((a, b) => a + b, 0)).toBe(plan.netUsd);
  });

  it("spreads the remainder so installments always sum exactly to the net", () => {
    // $100.00 → $1.00 fee → $99.00 net → base 24.75 → 2_475 × 4? 9900/4 = 2475 exact.
    const even = planWithdrawal(10_000);
    expect(even.feeUsd).toBe(100);
    expect(even.netUsd).toBe(9_900);
    expect(even.installments).toEqual([2_475, 2_475, 2_475, 2_475]);

    // $10.03 → fee 10 → net 993 → base 248, remainder 1 → the first installment gets +1.
    const odd = planWithdrawal(1_003);
    expect(odd.feeUsd).toBe(10);
    expect(odd.netUsd).toBe(993);
    expect(odd.installments).toEqual([249, 248, 248, 248]); // 993 = 249 + 3×248
    expect(odd.installments.reduce((a, b) => a + b, 0)).toBe(993);
  });

  it("handles tiny withdrawals exactly (dust policy: zeros allowed, sum exact)", () => {
    // 2 cents → fee 0 → net 2 → [1, 1, 0, 0].
    const tiny = planWithdrawal(2);
    expect(tiny.feeUsd).toBe(0);
    expect(tiny.netUsd).toBe(2);
    expect(tiny.installments.reduce((a, b) => a + b, 0)).toBe(2);
  });

  it("fee is never negative and never exceeds the gross", () => {
    for (const amount of [1, 99, 100, 1_234, 1_000_000]) {
      const plan = planWithdrawal(amount);
      expect(plan.feeUsd).toBeGreaterThanOrEqual(0);
      expect(plan.netUsd).toBeGreaterThanOrEqual(0);
      expect(plan.feeUsd + plan.netUsd).toBe(amount);
    }
  });
});

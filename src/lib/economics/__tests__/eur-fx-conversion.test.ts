// TDD RED — Option 1: approved fixed EUR→USD conversion (1 EUR = 1.20 USD).
// The 5 EUR villas must present non-null USD monthly income (full V1 chain in USD).
import { describe, expect, it } from "vitest";
import { getPresentedMonthlyIncome } from "../property-presentation";

const EUR_IDS = ["re-108924", "re-123861", "re-130901", "re-109098", "re-123919"];

describe("EUR FX conversion — Option 1 (1 EUR = 1.20 USD)", () => {
  it("presents non-null USD monthly income for every EUR villa", () => {
    for (const id of EUR_IDS) {
      const presented = getPresentedMonthlyIncome(id);
      expect(presented.cents, id).not.toBeNull();
      expect(presented.cents ?? 0, id).toBeGreaterThan(0);
      expect(presented.currency, id).toBe("USD");
      expect(presented.unknownKind, id).toBeNull();
    }
  });
});

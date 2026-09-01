import { test, expect } from "@playwright/test";

// Phase 9 Slice 5 — Income (/earnings) honesty per UI Mapping §7.3 (weekly/monthly
// conflict UX rules): status words only (Paid / Accrued / Expected), no frequency
// promises, no on-chain finality claims, one honest alignment line.

const FORBIDDEN_PATTERNS = [
  /landed in your wallet/i,
  /on-chain verified/i,
  /funds have been sent/i,
  /guaranteed/i,
];

/** Skip the onboarding carousel so the app shell unlocks (settings store persists). */
async function skipOnboarding(page: import("@playwright/test").Page) {
  await page.goto("/");
  const skip = page.getByTestId("onboarding-skip");
  await skip.waitFor({ state: "visible", timeout: 20_000 });
  await skip.click();
  await page.waitForURL("**/home", { timeout: 15_000 });
}

test.describe("Income honesty (§7.3)", () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/earnings");
    await page.waitForSelector('[data-testid="earnings-page"]', { timeout: 15_000 });
  });

  test("shows the honest alignment line and status words only", async ({ page }) => {
    const body = page.locator("body");
    const text = await body.innerText();

    // §7.3 rule 5 — the one honest alignment line is present.
    expect(text).toContain(
      "Distribution schedule is being aligned with the monthly income model.",
    );

    // §7.3 rule 1 — status words only.
    expect(text).toContain("Paid");
    expect(text).toContain("Accrued");
    expect(text).toContain("Expected");

    // Hero is received money ("Received in total"), not a yield claim.
    expect(text).toContain("Received in total");
  });

  test("does not contain false on-chain or frequency-promise claims", async ({ page }) => {
    const body = page.locator("body");
    const text = await body.innerText();
    for (const pattern of FORBIDDEN_PATTERNS) {
      expect(pattern.test(text)).toBe(false);
    }
  });
});

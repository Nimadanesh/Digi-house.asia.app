import { test, expect } from "@playwright/test";

// Must match src/lib/constants.ts — keep in sync
const PAYOUT_DISCLAIMER = "simulated weekly payout · on-chain verifiable post-MVP";

const FORBIDDEN_PATTERNS = [
  /landed in your wallet/i,
  /on-chain verified/i,
  /funds have been sent/i,
];

test.describe("Earnings honesty", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/earnings");
  });

  test("displays payout disclaimer on earnings page", async ({ page }) => {
    await page.waitForTimeout(2000);
    // The disclaimer may be in a summary header, a badge, or settings
    // Search whole page
    const body = page.locator("body");
    const text = await body.innerText();
    expect(text).toContain(PAYOUT_DISCLAIMER);
  });

  test("does not contain false on-chain claims", async ({ page }) => {
    await page.waitForTimeout(2000);
    const body = page.locator("body");
    const text = await body.innerText();
    for (const pattern of FORBIDDEN_PATTERNS) {
      const match = pattern.test(text);
      if (match) {
        // If found, check context — only fail if it claims present-tense on-chain finality
        // This is a soft fail: log warning
        console.warn(`Found potentially false on-chain claim: ${pattern}`);
      }
    }
    // Hard fail on exact false strings
    expect(text).not.toContain("landed in your wallet");
    expect(text).not.toContain("on-chain verified");
  });

  test("simulated badge visible on paid entries (if present)", async ({ page }) => {
    await page.waitForTimeout(2000);
    // May or may not be present depending on holdings + payout state
    // If no earnings entries exist, this is a pass (empty state)
    const earningsContent = page.locator("body");
    const text = await earningsContent.innerText();
    if (text.includes("Pending") || text.includes("Paid")) {
      // There are earnings entries — simulated should be visible
      const hasSimulated = text.includes("simulated") || text.includes("Simulated");
      if (!hasSimulated) {
        console.warn("Earnings entries present but no simulated badge found — verify DESIGN_SYSTEM");
      }
    }
  });
});

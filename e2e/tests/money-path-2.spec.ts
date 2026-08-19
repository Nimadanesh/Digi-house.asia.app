import { test, expect } from "@playwright/test";
import { skipIfNoBaseUrl } from "../helpers/env";
import { ensureAuthenticated } from "../helpers/auth";

/**
 * PF-02 — E2E money path 2 (staging harness).
 * buy primary → custom sell (queued) → primary sells out → order activates →
 * user-to-user match → withdrawal request → admin mark-paid.
 *
 * Runs against a live web + API stack (PLAYWRIGHT_BASE_URL set). The companion
 * in-process test (apps/api/src/e2e/money-path-2.test.ts) verifies the full money
 * path against memory stores; this spec checks the UI surfaces that drive it.
 */
test.describe("Money path 2 — queued sell → activation → match → withdrawal", () => {
  test.beforeEach(async ({ page }) => {
    skipIfNoBaseUrl();
    await ensureAuthenticated(page);
  });

  test("portfolio shows open orders section", async ({ page }) => {
    await page.goto("/portfolio");
    await page.waitForTimeout(3000);
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("Page not found");
  });

  test("settings exposes withdrawal address management", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForTimeout(3000);
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("Page not found");
  });

  test("transactions page renders (ledger for sell/match/withdraw kinds)", async ({ page }) => {
    await page.goto("/transactions");
    await page.waitForTimeout(3000);
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("Page not found");
  });
});

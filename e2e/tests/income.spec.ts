import { test, expect, type Page } from "@playwright/test";

// Phase 9 Slice 5 — Income (/earnings), redesign §10 / UI Mapping §7. Viewport 480×840 (config).

/** Skip the onboarding carousel so the app shell unlocks (settings store persists). */
async function skipOnboarding(page: Page) {
  await page.goto("/");
  const skip = page.getByTestId("onboarding-skip");
  await skip.waitFor({ state: "visible", timeout: 20_000 });
  await skip.click();
  await page.waitForURL("**/home", { timeout: 15_000 });
}

test.describe("Income — /earnings (Phase 9 Slice 5)", () => {
  test("Income identity, received-in-total hero, Expected status word, accrued block, chart legend, timeline, income by estate", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/earnings");
    await page.waitForSelector('[data-testid="earnings-page"]', { timeout: 15_000 });

    // Income identity first (H1 + subtitle).
    await expect(page.getByRole("heading", { name: "Income", exact: true })).toBeVisible();
    await expect(
      page.getByText("Your share of the rental income from every estate you own."),
    ).toBeVisible();

    // Hero = "Received in total" (paid money only) + Next distribution with Expected status.
    await expect(page.getByTestId("earnings-hero")).toBeVisible();
    await expect(page.getByText("Received in total")).toBeVisible();
    await expect(page.getByTestId("earnings-hero-amount")).toHaveText(/\$1,810\.41/);
    await expect(page.getByTestId("earnings-upcoming")).toBeVisible();
    await expect(page.getByTestId("earnings-upcoming")).toContainText("Expected");
    await expect(page.getByTestId("earnings-next-amount")).toContainText("$603.47");

    // Accrued block — clearly separated from received, sourced from lock accrual.
    await expect(page.getByTestId("yield-summary-card")).toBeVisible();
    await expect(page.getByTestId("yield-accrued-block")).toBeVisible();
    await expect(page.getByText("Accrued, paid with next distribution").first()).toBeVisible();
    await expect(page.getByTestId("yield-accrued-unpaid")).toHaveText(/\$[\d,]+\.\d{2}/);

    // Chart: static 12-week bars + Paid/Projected two-tone legend, no trader controls.
    await expect(page.getByTestId("earnings-chart")).toBeVisible();
    await expect(page.getByTestId("chart-bar")).toHaveCount(12);
    await expect(page.getByTestId("chart-legend")).toBeVisible();
    await expect(page.getByTestId("chart-legend")).toContainText("Paid");
    await expect(page.getByTestId("chart-legend")).toContainText("Projected");

    // Timeline: status words only — Paid / Accrued / Expected.
    await expect(page.getByTestId("timeline-paid")).toBeVisible();
    await expect(page.getByTestId("timeline-accrued")).toBeVisible();
    await expect(page.getByTestId("timeline-accrued")).toContainText("paid with next distribution");
    await expect(page.getByTestId("timeline-next")).toBeVisible();

    // The one honest alignment line (§7.3 rule 5).
    await expect(
      page.getByText("Distribution schedule is being aligned with the monthly income model."),
    ).toBeVisible();

    // Income by estate: per-estate rows with paid-only totals.
    await expect(page.getByTestId("income-by-estate")).toBeVisible();
    await expect(page.getByText("Income by estate")).toBeVisible();
    const bayside = page.getByTestId("income-by-estate-row-prop-bayside-marina-penthouse");
    await expect(bayside).toBeVisible();
    await expect(bayside).toContainText("Bayside Marina Penthouse");
    await expect(bayside).toContainText("$882.72"); // 3 paid weeks × $294.24
    await expect(bayside).toHaveAttribute("href", "/property/prop-bayside-marina-penthouse");
    await expect(
      page.getByTestId("income-by-estate-row-prop-alfama-terrace-flat"),
    ).toContainText("$927.69"); // 3 paid weeks × $309.23

    // No APY, no scarcity, no guarantees, no trading-terminal framing.
    await expect(page.getByText("APY")).toHaveCount(0);
    await expect(page.getByText("guaranteed", { exact: false })).toHaveCount(0);
    await expect(page.getByText("Almost Sold")).toHaveCount(0);

    // No horizontal overflow at 480×840.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);

    await page.screenshot({
      path: "screenshots/phase9-slice5/income-primary.png",
      fullPage: false,
    });
  });

  test("income-by-estate rows open the estate detail", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/earnings");
    await page.waitForSelector('[data-testid="earnings-page"]', { timeout: 15_000 });

    const bayside = page.getByTestId("income-by-estate-row-prop-bayside-marina-penthouse");
    await bayside.waitFor({ state: "visible", timeout: 15_000 });
    await bayside.click();
    await page.waitForURL("**/property/prop-bayside-marina-penthouse", { timeout: 15_000 });
    await expect(page.getByTestId("property-detail")).toBeVisible({ timeout: 15_000 });
  });
});

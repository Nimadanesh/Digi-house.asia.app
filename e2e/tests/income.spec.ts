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

    // Income journey: ranges + explorable paid/projected columns + cumulative
    // line legend. (Slice I observatory replaces the static 12-week chart with
    // tappable columns and a detail panel.)
    await expect(page.getByTestId("income-journey")).toBeVisible();
    await expect(page.getByTestId("journey-bar")).toHaveCount(12);
    await expect(page.getByTestId("journey-legend")).toBeVisible();
    await expect(page.getByTestId("journey-legend")).toContainText("Paid");
    await expect(page.getByTestId("journey-legend")).toContainText("Projected");
    // Tap the latest (pending-only) week: projected total + estate drill-down.
    await page.getByTestId("journey-bar").nth(11).click();
    await expect(page.getByTestId("journey-detail")).toContainText("$603.47");
    await expect(page.getByTestId("journey-detail")).toContainText("Syrene");
    // ALL range constrains honestly to data weeks.
    await page.getByTestId("journey-range-ALL").click();
    await expect(page.getByTestId("journey-bar")).toHaveCount(4);
    await page.getByTestId("journey-range-12W").click();

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
    // NOTE (Slice I): "Syrene" is the current seed title (Slice E reconciliation
    // renamed it from "Bayside Marina Penthouse"); rows resolve live marketplace
    // names, so the spec follows the catalog.
    await expect(page.getByTestId("income-by-estate")).toBeVisible();
    await expect(page.getByText("Income by estate")).toBeVisible();
    const bayside = page.getByTestId("income-by-estate-row-re-108924");
    await expect(bayside).toBeVisible();
    await expect(bayside).toContainText("Syrene");
    await expect(bayside).toContainText("$882.72"); // 3 paid weeks × $294.24
    await expect(bayside).toHaveAttribute("href", "/property/re-108924");
    await expect(
      page.getByTestId("income-by-estate-row-re-123861"),
    ).toContainText("$927.69"); // 3 paid weeks × $309.23
    // Slice I: rows carry position states from their own sources.
    await expect(bayside).toContainText("160 shares");
    await expect(bayside).toContainText("$294.24"); // projected (pending ledger)

    // Slice I: payout pipeline states are explicit (eligible/requested/scheduled/paid-out).
    await expect(page.getByTestId("dist-status")).toBeVisible();
    await expect(page.getByTestId("dist-eligible")).toBeVisible();
    await expect(page.getByTestId("dist-requested")).toContainText("$48.00");
    await expect(page.getByTestId("dist-scheduled")).toContainText("$47.52");
    await expect(page.getByTestId("dist-paidout")).toContainText("$123.75");

    // Slice I: other returns stay separate — no plans, no valuation history,
    // live sell listing with its proposed (never paid) gain.
    await expect(page.getByTestId("other-returns")).toBeVisible();
    await expect(page.getByTestId("other-plan")).toContainText("No investment plans configured");
    await expect(page.getByTestId("other-appreciation")).toContainText("Pending");
    const resale = page.getByTestId("other-secondary-ord-open-re-123861-sell-1");
    // (Final PO Decision 2: canonical $100 base cost — was +$30.00 at $105 fixture cost.)
    await expect(resale).toContainText("+$80.00");
    await expect(resale).toContainText("Gain");

    // Slice I: income origin explainer (collapsed, progressive disclosure).
    await expect(page.getByTestId("income-origin")).toBeVisible();
    await page.getByTestId("income-origin-toggle").click();
    await expect(page.getByTestId("income-origin-content")).toContainText("Net operating profit");

    // No APY, no scarcity, no guarantees, no trading-terminal framing.
    // Word-bounded: "Villa du Cap" + "Your income flow" concatenates to a text
    // containing "apy" (Cap|Your) — a bare substring matcher false-positives.
    await expect(page.getByText(/\bAPY\b/)).toHaveCount(0);
    await expect(page.getByText("guaranteed", { exact: false })).toHaveCount(0);
    await expect(page.getByText("Almost Sold")).toHaveCount(0);

    // No horizontal overflow at 480×840.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);

    await page.screenshot({
      path: "screenshots/runs/phase9-slice5/income-primary.png",
      fullPage: false,
    });
  });

  test("income-by-estate rows open the estate detail", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/earnings");
    await page.waitForSelector('[data-testid="earnings-page"]', { timeout: 15_000 });

    const bayside = page.getByTestId("income-by-estate-row-re-108924");
    await bayside.waitFor({ state: "visible", timeout: 15_000 });
    await bayside.click();
    await page.waitForURL("**/property/re-108924", { timeout: 15_000 });
    await expect(page.getByTestId("property-detail")).toBeVisible({ timeout: 15_000 });
  });
});

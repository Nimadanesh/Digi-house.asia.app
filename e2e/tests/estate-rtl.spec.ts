// PROMPT 05 RTL regression — fa locale at 480×840: rtl document, V1 thesis +
// investment legible, Income pills + Ownership facts legible, no overflow,
// no raw keys. Guards the RTL requirement.
import { test, expect, type Page } from "@playwright/test";

async function useFaLocale(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "digihouse-settings",
      JSON.stringify({
        state: {
          role: null,
          onboarded: true,
          useTelegramTheme: false,
          displayCurrency: "usd",
          locale: "fa",
          showDemoBadge: true,
        },
        version: 0,
      }),
    );
  });
}

test.describe("Prompt 05 RTL", () => {
  test.use({ locale: "fa-IR" });
  test("fa: rtl document, §4 desire sections + §5 V1 chain legible, no overflow", async ({ page }) => {
    await useFaLocale(page);
    await page.goto("/property/re-128862");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe("rtl");
    // §4 Estate tab: canonical desire sections in RTL.
    await expect(page.getByTestId("estate-why")).toBeVisible();
    await expect(page.getByTestId("estate-specs")).toBeVisible();
    await expect(page.getByTestId("estate-amenities")).toBeVisible();
    await expect(page.getByTestId("estate-location")).toBeVisible();
    // §3 4-stat section: localizes digits in fa — assert presence, not Latin glyphs.
    await expect(page.getByTestId("metrics-monthly")).not.toBeEmpty();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.getByTestId("estate-why").scrollIntoViewIfNeeded();
    await page.screenshot({ path: "screenshots/runs/slice-e-qa/rtl-fa-economics.png", fullPage: false });

    // §5 Income chain + §6 decision facts legible in RTL.
    await page.getByTestId("tab-income").click();
    await expect(page.getByTestId("panel-income")).toBeVisible();
    await expect(page.getByTestId("scenario-cards-average")).toBeVisible();
    await expect(page.getByTestId("income-net-per-share-monthly")).not.toBeEmpty();
    const overflowIncome = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflowIncome).toBeLessThanOrEqual(1);
    await page.getByTestId("tab-ownership").click();
    await expect(page.getByTestId("ownership-valuation")).toBeVisible();
    // Money localizes digits in fa — assert presence, not Latin glyphs.
    await expect(page.getByTestId("ownership-valuation-reference")).not.toBeEmpty();
    const overflowOwnership = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflowOwnership).toBeLessThanOrEqual(1);
  });

  test("fa: directional icons mirror (Slice 7 rtl variant)", async ({ page }) => {
    await useFaLocale(page);
    await page.goto("/property/re-128862");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });
    expect(await page.evaluate(() => document.documentElement.dir)).toBe("rtl");
    // The back chevron carries rtl:rotate-180 — the compiled variant must flip
    // it. (Tailwind v4 implements rotate via the CSS `rotate` property.)
    const rotate = await page.evaluate(() => {
      const svg = document.querySelector('[data-testid="header-back"] svg');
      return svg ? getComputedStyle(svg).rotate : "missing";
    });
    expect(rotate, "rtl variant flips the back chevron").not.toBe("none");
  });

  test("fa: non-Grand desire sections legible RTL, no overflow, no raw keys", async ({ page }) => {
    await useFaLocale(page);
    await page.goto("/property/re-126855");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe("rtl");
    // Reserve CTA resolves its label in the fa locale (no raw key).
    await expect(page.getByTestId("reserve-villa-cta")).toContainText("View & Reserve");
    // Structure §4 architecture intact in RTL.
    await expect(page.getByTestId("estate-why")).toBeVisible();
    await expect(page.getByTestId("estate-amenities")).toBeVisible();
    await expect(page.getByTestId("estate-location")).toBeVisible();
    // No raw i18n keys leak in the fa locale (key-shape detection only — the
    // panel legitimately contains EN dataset strings like amenity labels).
    const body = await page.getByTestId("panel-estate").innerText();
    expect(body).not.toMatch(
      /\b(estateWhy|estateSpecs|estateAmenities|estateLocation|incomeOccupancy|scenarioModeled|scenarioNights|scenarioMean|costBasis|exitLiquidity|exitSell|exitWithdrawal|exitMarket|previewTitle|previewIntro|previewShares|previewValue|previewMonthly|riskDisclosures|operatorTitle|operatorPhone|operatorEmail|legalStructure|legalOwnership|legalJurisdiction|insuranceLabel|insuranceInsurer|insurancePolicy|valuationLabel|valuationDate|valuationMethod|valuationValuer|documentsPending|distributionTitle|distributionAccrual|distributionSchedule|historicalTitle|historicalNote|metricMonthly|metricAvgNightly|metricEstGrowth|transferStatus)[A-Z]\w*/,
    );
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.getByTestId("estate-why").scrollIntoViewIfNeeded();
    await page.screenshot({ path: "screenshots/runs/slice-e-qa/rtl-fa-pending.png", fullPage: false });
  });
});

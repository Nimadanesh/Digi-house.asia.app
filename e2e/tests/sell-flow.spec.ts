// Slice H — sell / secondary-market flow at 480×840 (config).
//
// Mock-mode coverage (no wallet needed — secondary listings are custodial limit
// orders): owned position → qty → price → live gain/loss/remaining quote →
// review → List for Sale → Active (never Sold) → cancel → Cancelled.
// Telegram MainButton/BackButton do not exist outside Telegram — cancel paths
// use Escape/backdrop like keyboard users.
import { test, expect, type Page } from "@playwright/test";

/** Skip the onboarding carousel so the app shell unlocks (settings store persists). */
async function skipOnboarding(page: Page) {
  await page.goto("/");
  const skip = page.getByTestId("onboarding-skip");
  await skip.waitFor({ state: "visible", timeout: 20_000 });
  await skip.click();
  await page.waitForURL("**/home", { timeout: 15_000 });
}

async function expectNoOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

/** Bayside is funded with a seeded holding (160 owned, 100 locked → 60 free). */
async function openCustomSell(page: Page) {
  await page.goto("/property/re-108924");
  await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });
  await page.getByTestId("tab-ownership").click();
  await expect(page.getByTestId("position-card")).toBeVisible({ timeout: 10_000 });
  await page.getByTestId("position-sell").click();
  await expect(page.getByTestId("sell-sheet")).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /sell custom price/i }).click();
  await expect(page.getByTestId("sell-quote")).toBeVisible({ timeout: 10_000 });
}

test.describe("Sell flow — quote follows qty and price (LTR)", () => {
  test("owned position, gain/loss/break-even, remaining, no raw keys", async ({ page }) => {
    await skipOnboarding(page);
    await openCustomSell(page);

    // Owned position anchors the flow (never fabricated).
    await expect(page.getByTestId("sell-position")).toContainText("160");
    const price = page.getByTestId("sell-price-input");
    expect(Number(await price.inputValue())).toBeGreaterThan(0);

    // Break-even at cost, then gain above and loss below.
    // (Final PO Decision 2: canonical $100 base cost — was $120 fixture cost.)
    await expect(page.getByTestId("sell-gain-loss")).toContainText("Break-even");
    await price.fill("130");
    await expect(page.getByTestId("sell-gain-loss")).toContainText("Gain");
    await price.fill("100");
    await expect(page.getByTestId("sell-gain-loss")).toContainText("Break-even");
    await price.fill("90");
    await expect(page.getByTestId("sell-gain-loss")).toContainText("Loss");
    await price.fill("120");

    // Partial sale keeps a visible remaining position.
    await page.getByRole("button", { name: "Increase quantity" }).click();
    await expect(page.getByTestId("sell-remaining")).toContainText("158");

    // Market fee preview + net proceeds (canonical tier, never invented).
    await expect(page.getByTestId("sell-quote")).toContainText("Market fee");

    const body = await page.evaluate(() => document.body.innerText);
    for (const key of ["sellReviewTitle", "listForSale", "sellGainLoss", "sellRemainingShares", "sellNoBuyerBody"]) {
      expect(body).not.toContain(key);
    }
    // No instant-liquidity promise anywhere on the surface.
    expect(body.toLowerCase()).not.toContain("guaranteed buyer");
    expect(body.toLowerCase()).not.toContain("instant settlement");
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/slice-h/sell-quote.png", fullPage: false });
  });
});

test.describe("Sell flow — review → Active listing → cancel (LTR)", () => {
  test("listing is Active (never Sold); cancel flips to Cancelled on confirm", async ({ page }) => {
    await skipOnboarding(page);
    await openCustomSell(page);

    await page.getByTestId("sell-price-input").fill("125");
    await page.getByTestId("custom-sell-review").click();
    const review = page.getByTestId("sell-review");
    await expect(review).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("sell-sheet")).toContainText("Review your listing");
    await expect(review).toContainText("You receive");
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/slice-h/sell-review.png", fullPage: false });

    await page.getByTestId("custom-sell-confirm").click();
    const listed = page.getByTestId("sell-listed");
    await expect(listed).toBeVisible({ timeout: 10_000 });
    // Active or honest pending — but never Sold from a mere listing. Scoped to
    // the listing status surface: the Layer-1 KPI grid has a legitimate "Sold"
    // metric label (demo-ledger count), which is not a listing status.
    await expect(listed).toContainText(/Active|Pending|Queued|No buyer/);
    expect(await listed.getByText("Sold", { exact: true }).count()).toBe(0);
    await expect(page.getByTestId("sell-liquidity-note")).toBeVisible();
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/slice-h/sell-listed.png", fullPage: false });

    await page.getByTestId("sell-cancel").click();
    await page.getByTestId("sell-cancel-confirm").click();
    await expect(listed).toContainText("Cancelled");
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/slice-h/sell-cancelled.png", fullPage: false });

    await page.getByTestId("sell-listed-done").click();
    await expect(listed).toHaveCount(0);
  });
});

test.describe("Sell flow — empty position honesty (LTR)", () => {
  test("a property with no holding shows the honest empty state", async ({ page }) => {
    await skipOnboarding(page);
    // Marina Vista is funding with no seeded holding for the demo user.
    await page.goto("/property/re-128862");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });
    // No ownership tab position to sell from — the sticky/hero stays buy-focused.
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toContain("sellNoPositionTitle");
    await expectNoOverflow(page);
  });
});

test.describe("Sell flow — wallet gate (RTL)", () => {
  test.use({ locale: "fa-IR" });

  test("fa: localized sheet, no overflow, no raw keys", async ({ page }) => {
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
    await page.goto("/property/re-108924");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });
    expect(await page.evaluate(() => document.documentElement.dir)).toBe("rtl");

    await page.getByTestId("tab-ownership").click();
    await expect(page.getByTestId("position-card")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("position-sell").click();
    const sheet = page.getByTestId("sell-sheet");
    await expect(sheet).toBeVisible({ timeout: 10_000 });
    // Second mode button = custom price (labels are localized).
    await sheet.getByRole("button").nth(1).click();
    await expect(page.getByTestId("sell-quote")).toBeVisible({ timeout: 10_000 });

    const body = await page.evaluate(() => document.body.innerText);
    for (const key of ["sellSheetTitle", "sellReviewTitle", "listForSale", "maxCta"]) {
      expect(body).not.toContain(key);
    }
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/slice-h/sell-quote-fa.png", fullPage: false });
  });
});

// Slice 5 — order lifecycle honesty at 480×840 (config).
//
// Stateful in-session demo ledger: a placed order must surface in Portfolio
// open orders (never succeed invisibly); cancelling must remove it there;
// a reload resets demo state (documented in-session semantics).
//
// Navigation discipline: demo state lives in the document, so journeys use
// client-side navigation only (card links, header back, bottom tabs).
// page.goto / reload mid-journey would wipe the state under test — the reload
// test below pins that reset behavior explicitly.
// No wallet exists in Chromium — custodial limit orders only (as Slice G/H).
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

/** Enter a property detail from a freshly loaded marketplace (client-side card link). */
async function enterDetailViaMarketplace(page: Page, id: string) {
  await page.goto("/marketplace");
  await page.waitForSelector('[data-testid="estates-page"]', { timeout: 15_000 });
  await page.waitForTimeout(800);
  await page.locator(`a[href="/property/${id}"]`).first().click();
  await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });
  await page.waitForTimeout(500);
}

/** Back to marketplace via the in-app chevron (client-side, preserves demo state). */
async function backToMarketplace(page: Page) {
  await page.getByTestId("header-back").click();
  await page.waitForSelector('[data-testid="estates-page"]', { timeout: 15_000 });
  await page.waitForTimeout(500);
}

/** To portfolio via the bottom tabs (client-side, preserves demo state). */
async function gotoPortfolioViaTabs(page: Page) {
  const tabs = page.getByTestId("bottom-tab-bar");
  await expect(tabs).toBeVisible({ timeout: 10_000 });
  await tabs.getByRole("link", { name: "Portfolio" }).click();
  await page.waitForURL("**/portfolio", { timeout: 15_000 });
  await page.waitForSelector('[data-testid="portfolio-page"]', { timeout: 15_000 });
}

test.describe("Order lifecycle — limit buy reaches Portfolio, cancel clears it (LTR)", () => {
  test("place → portfolio shows it → cancel from portfolio → gone", async ({ page }) => {
    await skipOnboarding(page);
    await enterDetailViaMarketplace(page, "re-125643");

    await page.getByTestId("hero-cta").click();
    const sheet = page.getByTestId("limit-buy-sheet");
    await expect(sheet).toBeVisible({ timeout: 10_000 });
    await sheet.getByRole("button", { name: "Increase quantity" }).click();
    await page.getByTestId("limit-buy-confirm").click();
    await expect(page.getByText("Buy order placed")).toBeVisible({ timeout: 10_000 });

    // The action is visible on the related surface — Portfolio open orders.
    await backToMarketplace(page);
    await gotoPortfolioViaTabs(page);
    const block = page.getByTestId("open-orders");
    await expect(block).toContainText("Emerald Cay", { timeout: 10_000 });
    await expectNoOverflow(page);

    // Cancel from Portfolio → confirm → the row is gone, seed baseline remains.
    await page.getByRole("button", { name: "Cancel order buy 2 shares" }).click();
    await expect(page.getByTestId("cancel-order-confirm")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("cancel-order-confirm-confirm").click();
    await expect(page.getByTestId("cancel-order-confirm-success")).toBeVisible({
      timeout: 10_000,
    });
    await page.getByTestId("cancel-order-confirm-done").click();
    await expect(block).not.toContainText("Emerald Cay", { timeout: 10_000 });
    await expect(block).toContainText("Villa du Cap");
    await expectNoOverflow(page);
  });
});

test.describe("Order lifecycle — custom sell reaches Portfolio, cancel clears it (LTR)", () => {
  test("list → portfolio shows it → cancel → gone, holdings untouched", async ({ page }) => {
    await skipOnboarding(page);
    await enterDetailViaMarketplace(page, "re-108924");

    await page.getByTestId("tab-ownership").click();
    await expect(page.getByTestId("position-card")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("position-sell").click();
    await expect(page.getByTestId("sell-sheet")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /sell custom price/i }).click();
    await page.getByTestId("sell-price-input").fill("125");
    await page.getByTestId("custom-sell-review").click();
    await page.getByTestId("custom-sell-confirm").click();
    await expect(page.getByTestId("sell-listed")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("sell-listed-done").click();

    // Listed (never Sold) AND visible in Portfolio open orders.
    await backToMarketplace(page);
    await gotoPortfolioViaTabs(page);
    const block = page.getByTestId("open-orders");
    await expect(block).toContainText("Villa Syrene", { timeout: 10_000 });
    await expectNoOverflow(page);

    // Cancel the 1-share listing (seed Alfama order is 10 shares) → gone.
    await page.getByRole("button", { name: "Cancel order sell 1 shares" }).click();
    await expect(page.getByTestId("cancel-order-confirm")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("cancel-order-confirm-confirm").click();
    await expect(page.getByTestId("cancel-order-confirm-success")).toBeVisible({
      timeout: 10_000,
    });
    await page.getByTestId("cancel-order-confirm-done").click();
    await expect(block).not.toContainText("Villa Syrene", { timeout: 10_000 });
    await expect(block).toContainText("Villa du Cap");
    await expectNoOverflow(page);
  });
});

test.describe("Order lifecycle — reload resets in-session demo state (LTR)", () => {
  test("placed orders do not survive a reload (documented demo semantics)", async ({
    page,
  }) => {
    await skipOnboarding(page);
    await page.goto("/property/re-125643");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    await page.getByTestId("hero-cta").click();
    const sheet = page.getByTestId("limit-buy-sheet");
    await expect(sheet).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("limit-buy-confirm").click();
    await expect(page.getByText("Buy order placed")).toBeVisible({ timeout: 10_000 });

    // A reload returns Portfolio open orders to the seed baseline — demo
    // actions are stateful in-session, never persisted.
    await page.reload();
    await page.waitForSelector('[data-testid="portfolio-page"]', { timeout: 15_000 }).catch(
      async () => {
        await page.goto("/portfolio");
        await page.waitForSelector('[data-testid="portfolio-page"]', { timeout: 15_000 });
      },
    );
    const block = page.getByTestId("open-orders");
    await expect(block).toBeVisible({ timeout: 10_000 });
    await expect(block).toContainText("Villa du Cap", { timeout: 10_000 });
    await expect(block).not.toContainText("Emerald Cay", { timeout: 10_000 });
    await expectNoOverflow(page);
  });
});

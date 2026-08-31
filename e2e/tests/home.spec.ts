import { test, expect, type Page } from "@playwright/test";

// Phase 9 Slice 3 — Home (UI Mapping §3). Viewport is 480×840 (config).

/** Skip the onboarding carousel so the app shell unlocks (settings store persists). */
async function skipOnboarding(page: Page) {
  await page.goto("/");
  const skip = page.getByTestId("onboarding-skip");
  await skip.waitFor({ state: "visible", timeout: 20_000 });
  await skip.click();
  // complete() → router.replace(/home) once onboarded is persisted.
  await page.waitForURL("**/home", { timeout: 15_000 });
}

test.describe("Home — ownership-first (Phase 9 Slice 3)", () => {
  test("Your Estates hero, Next Distribution (Expected), My Estates, Featured Estate, More Estates", async ({ page }) => {
    await skipOnboarding(page);
    // The skip flow lands on /home — re-navigate to guarantee a fresh Home render.
    await page.goto("/home");
    await page.waitForSelector('[data-testid="home-page"]', { timeout: 15_000 });

    // 1. Your Estates ownership hero — one dominant CTA.
    await expect(page.getByTestId("your-estates-card")).toBeVisible();
    await expect(page.getByTestId("your-estates-amount")).toBeVisible();
    await expect(page.getByTestId("your-estates-cta")).toHaveText("View My Estates");
    await expect(page.getByTestId("your-estates-secondary")).toContainText("rental income YTD");
    // No simulated day-change badge.
    await expect(page.getByTestId("day-change-badge")).toHaveCount(0);

    // 2. Next Distribution — scheduled amount labeled Expected, never "guaranteed".
    await expect(page.getByTestId("next-payout-summary")).toBeVisible();
    await expect(page.getByText("Next Distribution")).toBeVisible();
    await expect(page.getByTestId("next-distribution-status")).toHaveText("Expected");
    await expect(page.getByTestId("next-payout-amount")).toBeVisible();

    // 3. My Estates preview — ownership vocabulary on the mini position cards.
    await expect(page.getByText("My Estates (2)")).toBeVisible();
    const chips = page.getByTestId("home-property-chip");
    await expect(chips.first()).toBeVisible();
    await expect(chips.first()).toContainText("of the estate");
    await expect(page.getByText("All my estates")).toBeVisible();

    // 4. Featured Estate — identity first, no APY/metrics hero, honest owner-stay state.
    await expect(page.getByText("Featured Estate")).toBeVisible();
    await expect(page.getByTestId("featured-card")).toBeVisible();
    await expect(page.getByText("APY")).toHaveCount(0);
    await expect(page.getByTestId("featured-cta")).toHaveText("View Estate");
    await expect(page.getByText("Owner stay")).toBeVisible();
    await expect(page.getByText("Data pending")).toBeVisible();

    // 5. More Estates rail.
    await expect(page.getByText("More Estates")).toBeVisible();
    const moreCards = page.getByTestId("more-opportunity-card");
    await expect(moreCards.first()).toBeVisible();

    // 6. Trust footer.
    await expect(page.getByTestId("home-trust-footer")).toBeVisible();

    // No horizontal overflow at 480×840.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);

    await page.screenshot({
      path: "screenshots/phase9-slice3/home-primary.png",
      fullPage: false,
    });
  });

  test("CTA reachability: hero → My Estates (portfolio), Featured → Estate Detail", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/home");
    await page.waitForSelector('[data-testid="home-page"]', { timeout: 15_000 });

    // Dominant CTA: View My Estates lands on /portfolio.
    await page.getByTestId("your-estates-card").click();
    await page.waitForURL("**/portfolio", { timeout: 15_000 });
    await page.goBack();
    await page.waitForSelector('[data-testid="home-page"]', { timeout: 15_000 });

    // Quiet discovery CTA: View Estate lands on the estate detail.
    await page.getByTestId("featured-card").click();
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });
    // The estate detail still carries the 4-tab Phase 9 model (no Estate Detail regression).
    await expect(page.getByTestId("property-tabs")).toBeVisible();

    await page.screenshot({
      path: "screenshots/phase9-slice3/home-featured-navigation.png",
      fullPage: false,
    });
  });
});
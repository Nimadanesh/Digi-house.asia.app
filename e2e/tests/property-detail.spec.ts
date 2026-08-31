import { test, expect, type Page } from "@playwright/test";

// Phase 9 Slice 2 — Estate Detail (UI Mapping §5). Viewport is 480×840 (config).

/** Skip the onboarding carousel so the app shell unlocks (settings store persists). */
async function skipOnboarding(page: Page) {
  await page.goto("/");
  const skip = page.getByTestId("onboarding-skip");
  await skip.waitFor({ state: "visible", timeout: 20_000 });
  await skip.click();
  // complete() → router.replace(/home) once onboarded is persisted.
  await page.waitForURL("**/home", { timeout: 15_000 });
}

test.describe("Estate Detail — Phase 9 4-tab model", () => {
  test("primary estate: identity-first hero + 4 tabs; resale market absent while shares remain", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/prop-marina-vista-4b");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    // Hero: ownership proposition with share price + fraction; no APY hero number.
    await expect(page.getByTestId("hero-price")).toBeVisible();
    await expect(page.getByTestId("hero-fraction")).toBeVisible();
    await expect(page.getByTestId("hero-cta")).toContainText("Acquire Ownership");
    await expect(page.getByTestId("hero-apy")).toHaveCount(0);

    // 4 tabs; Estate is the default.
    const tabs = page.getByTestId("property-tabs");
    await expect(tabs).toBeVisible();
    await expect(page.getByTestId("tab-estate")).toHaveAttribute("aria-selected", "true");
    for (const tab of ["estate", "income", "ownership", "details"]) {
      await expect(page.getByTestId(`tab-${tab}`)).toBeVisible();
    }
    // Dissolved tabs must not exist.
    for (const tab of ["overview", "performance", "holders"]) {
      await expect(page.getByTestId(`tab-${tab}`)).toHaveCount(0);
    }

    // Estate tab: funding story + rental-economics narrative with honest unavailable steps.
    await expect(page.getByTestId("funding-panel")).toBeVisible();
    await expect(page.getByTestId("rental-story-costs")).toContainText("Not yet reported");
    await expect(page.getByTestId("rental-story-net")).toContainText("Not yet reported");
    // No resale market on a funding estate with shares remaining.
    await expect(page.getByTestId("resale-block")).toHaveCount(0);
    // Trust moved to Details — verification pending, management not published.
    await page.getByTestId("tab-details").click();
    await expect(page.getByTestId("trust-verification-pending")).toContainText("Verification pending");
    await expect(page.getByTestId("trust-management")).toContainText("not yet published");
    await page.screenshot({
      path: "screenshots/phase9-slice2/estate-detail-primary.png",
      fullPage: false,
    });
  });

  test("secondary estate: resale market demoted behind the collapsed block; price history expander", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/prop-bayside-marina-penthouse");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    // Resale block collapsed by default — no market content in the default scroll.
    await expect(page.getByTestId("resale-block")).toBeVisible();
    await expect(page.getByTestId("resale-block-content")).toHaveCount(0);
    // Hero CTA is ownership-state-aware (seed user owns this estate → Manage Ownership).
    await expect(page.getByTestId("hero-cta")).toContainText(/Manage Ownership|Acquire Resale Ownership/);

    // Expand → ownership-vocabulary summary + acquire CTA.
    await page.getByTestId("resale-toggle").click();
    await expect(page.getByTestId("resale-block-content")).toBeVisible();
    await expect(page.getByTestId("resale-acquire-cta")).toBeVisible();
    await expect(page.getByText("Best asking price")).toBeVisible();
    await expect(page.getByText("Best offer")).toBeVisible();

    // Price/OHLC/volume charts stay hidden until the simulated-history expander opens.
    await expect(page.getByTestId("price-svg")).toHaveCount(0);
    await page.getByTestId("resale-price-history-toggle").click();
    await expect(page.getByTestId("price-svg")).toBeVisible();
    await expect(page.getByText("Price history (simulated)")).toBeVisible();
    await expect(page.getByText("Simulated history for illustration", { exact: false })).toBeVisible();
    await page.screenshot({
      path: "screenshots/phase9-slice2/estate-detail-resale-block.png",
      fullPage: false,
    });
  });

  test("ownership tab: position card + Owner Stay P0 (honest unavailable) + lock management", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/prop-bayside-marina-penthouse");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    await page.getByTestId("tab-ownership").click();
    // Owner Stay P0: the seeded owner sees the honest unavailable state + disabled calendar CTA.
    await expect(page.getByTestId("owner-stay-card")).toBeVisible();
    await expect(page.getByTestId("owner-stay-calendar-cta")).toBeDisabled();
    await expect(page.getByTestId("owner-stay-availability")).toContainText("Data pending");
    // Yield/lock management + holder analytics live under Ownership.
    await expect(page.getByTestId("yield-lock-section")).toBeVisible();
    await page.screenshot({
      path: "screenshots/phase9-slice2/estate-detail-ownership-tab.png",
      fullPage: false,
    });
  });

  test("no horizontal overflow at 480×840 on the estate detail surface", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/prop-marina-vista-4b");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
});

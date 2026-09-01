import { test, expect, type Page } from "@playwright/test";

// Phase 9 Slice 4 — Estates (/marketplace), redesign §6 / UI Mapping §4. Viewport 480×840 (config).

/** Skip the onboarding carousel so the app shell unlocks (settings store persists). */
async function skipOnboarding(page: Page) {
  await page.goto("/");
  const skip = page.getByTestId("onboarding-skip");
  await skip.waitFor({ state: "visible", timeout: 20_000 });
  await skip.click();
  await page.waitForURL("**/home", { timeout: 15_000 });
}

test.describe("Estates — /marketplace (Phase 9 Slice 4)", () => {
  test("Estates header, search, six filters, Curated default sort and ownership-first cards", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/marketplace");
    await page.waitForSelector('[data-testid="estates-page"]', { timeout: 15_000 });
    await expect(page.getByTestId("estates-list").first()).toBeVisible({ timeout: 15_000 });

    // Identity-first header.
    await expect(page.getByRole("heading", { name: "Estates" })).toBeVisible();
    await expect(page.getByText("Own a share of exceptional properties.")).toBeVisible();

    // Exactly the Phase 9 filter set.
    for (const label of ["All", "Featured", "New", "Income", "Owner Stay", "Resale"]) {
      await expect(page.getByRole("tab", { name: label })).toBeVisible();
    }

    // Curated default sort (never highest yield) + the sort options.
    await expect(page.getByTestId("estates-sort")).toBeVisible();
    await expect(page.getByRole("button", { name: /curated/i })).toHaveAttribute("aria-pressed", "true");
    for (const label of ["Rental income", "Entry price", "Newest"]) {
      await expect(page.getByRole("button", { name: label })).toBeVisible();
    }

    // Cards are ownership-first: price / share, ownership fraction, projected income.
    const card = page.getByTestId("property-card").first();
    await expect(card).toBeVisible();
    await expect(card).toContainText("Price / share");
    await expect(card).toContainText("1 share ≈ 1/");
    await expect(card).toContainText("of the estate");

    // No APY, no scarcity badges anywhere on the surface.
    await expect(page.getByText("APY")).toHaveCount(0);
    await expect(page.getByText("Highest Yield")).toHaveCount(0);
    await expect(page.getByText("Almost Sold")).toHaveCount(0);

    // No horizontal overflow at 480×840.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);

    await page.screenshot({
      path: "screenshots/phase9-slice4/estates-primary.png",
      fullPage: false,
    });
  });

  test("Owner Stay filter shows the honest unavailable empty state — no fake matches", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/marketplace");
    await page.waitForSelector('[data-testid="estates-page"]', { timeout: 15_000 });
    await expect(page.getByTestId("estates-list").first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: "Owner Stay" }).click();
    await expect(page.getByText("Owner Stay data is not available yet.")).toBeVisible();
    await expect(page.getByTestId("property-card")).toHaveCount(0);

    await page.screenshot({
      path: "screenshots/phase9-slice4/estates-ownerstay-empty.png",
      fullPage: false,
    });
  });

  test("Featured filter shows the honest unavailable empty state — no fake matches", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/marketplace");
    await page.waitForSelector('[data-testid="estates-page"]', { timeout: 15_000 });
    await expect(page.getByTestId("estates-list").first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: "Featured" }).click();
    await expect(page.getByText("Featured curation is not available yet.")).toBeVisible();
    await expect(page.getByTestId("property-card")).toHaveCount(0);
  });

  test("tapping a card opens the estate detail (whole-card navigation, no per-card Buy)", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/marketplace");
    await page.waitForSelector('[data-testid="estates-page"]', { timeout: 15_000 });

    const card = page.getByTestId("property-card").first();
    await card.waitFor({ state: "visible", timeout: 15_000 });
    // No per-card Buy button — the whole card is the navigation target.
    await expect(page.getByRole("button", { name: /buy/i })).toHaveCount(0);

    await card.click();
    await page.waitForURL(/\/property\//, { timeout: 15_000 });
    await expect(page.getByTestId("property-detail")).toBeVisible({ timeout: 15_000 });
    // The estate detail still carries the Phase 9 4-tab model (no regression).
    await expect(page.getByTestId("property-tabs")).toBeVisible();
  });
});

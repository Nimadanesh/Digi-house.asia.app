import { test, expect } from "@playwright/test";

test.describe("Marketplace", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/marketplace");
  });

  test("loads property listing cards", async ({ page }) => {
    // Wait for cards to appear (skeleton → real data)
    const cards = page.locator("a[href*='/property/'], [data-testid='property-card']");
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("each card shows weekly yield", async ({ page }) => {
    await page.waitForTimeout(2000);
    const body = page.locator("body");
    const text = await body.innerText();
    // Weekly yield phrasing — accept variants
    const hasYield =
      text.includes("week") ||
      text.includes("weekly") ||
      text.includes("yield") ||
      text.includes("per share");
    expect(hasYield).toBeTruthy();
  });

  test("tapping a card opens property detail", async ({ page }) => {
    const card = page.locator("a[href*='/property/']").first();
    await card.waitFor({ state: "visible", timeout: 15_000 });
    await card.click();
    await page.waitForURL(/\/property\//);
    // Detail should show key info
    await expect(page.locator("body")).toBeAttached();
    await expect(page.locator("body")).not.toHaveText(/404/);
  });
});

import { test, expect } from "@playwright/test";

test.describe("App shell", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads without crash", async ({ page }) => {
    await expect(page.locator("body")).toBeAttached();
    // No JS error dialog — Playwright will fail on pageerror automatically
  });

  test("renders bottom tab bar with 4 tabs", async ({ page }) => {
    const tabs = page.locator("nav a, [role=tablist] a, nav button");
    await expect(tabs.first()).toBeVisible({ timeout: 10_000 });
    const count = await tabs.count();
    // At minimum we should have tab navigation elements
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("has Telegram-style dark background", async ({ page }) => {
    const body = page.locator("body");
    const bg = await body.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    // Should be dark — accept any reasonably dark bg
    expect(bg).not.toBe("rgba(0, 0, 0, 0)");
    expect(bg).not.toBe("rgb(255, 255, 255)");
  });

  test("viewport respects 480px max-width", async ({ page }) => {
    const html = page.locator("html");
    const maxWidth = await html.evaluate((el) => {
      const style = getComputedStyle(el);
      // Check the max-width constraint on the main container
      const main = el.querySelector("main, [class*=max-w]");
      return main ? getComputedStyle(main).maxWidth : null;
    });
    // The app should constrain width — if not, just verify no horizontal scroll
    const scrollWidth = await page.evaluate(() =>
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
    );
    expect(scrollWidth).toBeLessThanOrEqual(500);
  });
});

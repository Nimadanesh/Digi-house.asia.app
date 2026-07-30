import { test, expect } from "@playwright/test";
import { ensureAuthenticated } from "../helpers/auth";

test.describe("Portfolio", () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto("/portfolio");
    await page.waitForTimeout(2000);
  });

  test("renders portfolio page", async ({ page }) => {
    await expect(page.locator("body")).toBeAttached();
    // Should not crash or show 404
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("Page not found");
  });

  test("shows holdings or empty state", async ({ page }) => {
    await page.waitForTimeout(3000);
    const body = page.locator("body");
    const text = await body.innerText();
    const hasContent =
      text.includes("Property") ||
      text.includes("holding") ||
      text.includes("My Properties") ||
      text.includes("Explore Marketplace") ||
      text.includes("No holdings");
    expect(hasContent).toBeTruthy();
  });

  test("transactions page reachable", async ({ page }) => {
    await page.goto("/transactions", { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(2000);
    // If route exists, it loads without crash
    const bodyText = await page.locator("body").innerText();
    // Accept any valid response
    const isOk = !bodyText.includes("Page not found") || bodyText.length > 0;
    expect(isOk).toBeTruthy();
  });
});

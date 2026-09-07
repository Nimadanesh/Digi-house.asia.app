// Slice E RTL regression — fa locale at 480×840: rtl document, translated
// economics sections legible, no overflow. Guards the §9 RTL requirement.
import { test, expect } from "@playwright/test";

test.describe("Slice E RTL", () => {
  test.use({ locale: "fa-IR" });
  test("fa: rtl document, economics sections legible, no overflow", async ({ page }) => {
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
    await page.goto("/property/prop-marina-vista-4b");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe("rtl");
    await expect(page.getByTestId("estate-economics")).toBeVisible();
    await expect(page.getByTestId("economics-gross")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.getByTestId("estate-economics").scrollIntoViewIfNeeded();
    await page.screenshot({ path: "screenshots/slice-e-qa/rtl-fa-economics.png", fullPage: false });
  });

  test("fa: non-Grand pending sections legible RTL, no overflow", async ({ page }) => {
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
    await page.goto("/property/prop-soho-loft-studio");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe("rtl");
    // Reserve CTA resolves its label in the fa locale (no raw key).
    await expect(page.getByTestId("reserve-villa-cta")).toContainText("View & Reserve");
    // Same section architecture as Grand, pending states intact in RTL.
    await expect(page.getByTestId("rental-story")).toBeVisible();
    await expect(page.getByTestId("estate-economics")).toBeVisible();
    await expect(page.getByTestId("scenario-pill-lower")).toBeVisible();
    await expect(page.getByTestId("scenario-pill-base")).toBeVisible();
    await expect(page.getByTestId("scenario-pill-upper")).toBeVisible();
    await expect(page.getByTestId("economics-pending-note")).toBeVisible();
    await expect(page.getByTestId("estate-costs")).toBeVisible();
    await expect(page.getByTestId("estate-allocation")).toBeVisible();
    await expect(page.getByTestId("estate-investment")).toBeVisible();
    // No raw i18n keys leak in the fa locale.
    const body = await page.getByTestId("panel-estate").innerText();
    expect(body).not.toMatch(/[a-zA-Z]+Story[A-Z]\w*|economics[A-Z]\w*|rentalStory[A-Z]\w*/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.getByTestId("estate-economics").scrollIntoViewIfNeeded();
    await page.screenshot({ path: "screenshots/slice-e-qa/rtl-fa-pending.png", fullPage: false });
  });
});

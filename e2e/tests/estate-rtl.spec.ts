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
  test("fa: rtl document, V1 thesis + investment legible, no overflow", async ({ page }) => {
    await useFaLocale(page);
    await page.goto("/property/re-128862");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe("rtl");
    await expect(page.getByTestId("estate-v1-thesis")).toBeVisible();
    await expect(page.getByTestId("thesis-anr")).toBeVisible();
    await expect(page.getByTestId("thesis-revenue")).toBeVisible();
    await expect(page.getByTestId("thesis-pershare")).toBeVisible();
    await expect(page.getByTestId("estate-investment")).toBeVisible();
    // Share counts localize digits in fa (toLocaleString) — assert presence, not Latin glyphs.
    await expect(page.getByTestId("investment-total-shares")).not.toBeEmpty();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.getByTestId("estate-v1-thesis").scrollIntoViewIfNeeded();
    await page.screenshot({ path: "screenshots/runs/slice-e-qa/rtl-fa-economics.png", fullPage: false });

    // Income V1 pills + Ownership V1 facts legible in RTL.
    await page.getByTestId("tab-income").click();
    await expect(page.getByTestId("income-v1-story")).toBeVisible();
    await expect(page.getByTestId("scenario-v1-average")).toBeVisible();
    await expect(page.getByTestId("income-v1-gross")).toBeVisible();
    const overflowIncome = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflowIncome).toBeLessThanOrEqual(1);
    await page.getByTestId("tab-ownership").click();
    await expect(page.getByTestId("ownership-v1-panel")).toBeVisible();
    // Money localizes digits in fa — assert presence, not Latin glyphs.
    await expect(page.getByTestId("ownership-v1-price")).not.toBeEmpty();
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

  test("fa: non-Grand V1 thesis legible RTL, no overflow, no raw keys", async ({ page }) => {
    await useFaLocale(page);
    await page.goto("/property/re-126855");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe("rtl");
    // Reserve CTA resolves its label in the fa locale (no raw key).
    await expect(page.getByTestId("reserve-villa-cta")).toContainText("View & Reserve");
    // V1 architecture intact in RTL.
    await expect(page.getByTestId("rental-story")).toBeVisible();
    await expect(page.getByTestId("estate-v1-thesis")).toBeVisible();
    await expect(page.getByTestId("estate-investment")).toBeVisible();
    // No raw i18n keys leak in the fa locale.
    const body = await page.getByTestId("panel-estate").innerText();
    expect(body).not.toMatch(/[a-zA-Z]+V1[A-Z]\w*|v1Thesis[A-Z]\w*|incomeV1[A-Z]\w*|ownershipV1[A-Z]\w*/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.getByTestId("estate-v1-thesis").scrollIntoViewIfNeeded();
    await page.screenshot({ path: "screenshots/runs/slice-e-qa/rtl-fa-pending.png", fullPage: false });
  });
});

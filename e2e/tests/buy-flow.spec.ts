// Slice G — investment/buy flow at 480×840 (config).
//
// Browser-reachable coverage: wallet gating is real here (no wallet in
// Chromium), so the primary sheet stops at the connect gate while the
// secondary limit sheet executes end-to-end. Qty/summary/confirm/purchase
// steps are covered by unit tests driving the captured MainButton handlers.
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

test.describe("Buy flow — primary entry + wallet gate (LTR)", () => {
  test("hero opens the sheet at the wallet gate; Escape cancels cleanly", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/prop-marina-vista-4b");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    await page.getByTestId("hero-cta").click();
    await expect(page.getByTestId("buy-qty-step")).toBeVisible({ timeout: 10_000 });
    // No wallet in the browser → honest connect gate, never a dead form.
    await expect(page.getByText("Connect wallet")).toBeVisible();
    await expect(page.getByText("Connect a TON wallet to buy shares")).toBeVisible();
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/slice-g/buy-connect.png", fullPage: false });

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("buy-qty-step")).toHaveCount(0);
  });

  test("calculator Buy CTA opens the same sheet (entry diversity)", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/prop-marina-vista-4b");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    await page.getByTestId("tab-income").click();
    await expect(page.getByTestId("calc-buy")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("calc-buy").click();
    await expect(page.getByTestId("buy-qty-step")).toBeVisible({ timeout: 10_000 });
    await expectNoOverflow(page);
  });

  test("no raw i18n keys leak on the buy surfaces", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/prop-marina-vista-4b");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    await page.getByTestId("hero-cta").click();
    await expect(page.getByTestId("buy-qty-step")).toBeVisible({ timeout: 10_000 });
    const body = await page.evaluate(() => document.body.innerText);
    for (const key of ["buySheetTitle", "buyShareOfEstate", "buyFirstNote", "maxCta", "payWithAria"]) {
      expect(body).not.toContain(key);
    }
  });
});

test.describe("Buy flow — secondary market order end-to-end (LTR)", () => {
  test("resale estate places a limit buy with fee preview and escrow total", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/prop-tbilisi-riverhouse-loft");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    await page.getByTestId("hero-cta").click();
    const sheet = page.getByTestId("limit-buy-sheet");
    await expect(sheet).toBeVisible({ timeout: 10_000 });
    // Seeded book context — best ask anchors the price input.
    const price = await page.getByTestId("limit-buy-price-input").inputValue();
    expect(Number(price)).toBeGreaterThan(0);
    await expect(page.getByTestId("limit-buy-summary")).toContainText("Market fee");
    await expect(page.getByTestId("limit-buy-summary")).toContainText("escrow");
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/slice-g/buy-terms.png", fullPage: false });

    await sheet.getByRole("button", { name: "Increase quantity" }).click();
    await page.getByTestId("limit-buy-confirm").click();
    await expect(page.getByText("Buy order placed")).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Buy flow — wallet gate (RTL)", () => {
  test.use({ locale: "fa-IR" });

  test("fa: localized gate, no overflow, no raw keys", async ({ page }) => {
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
    expect(await page.evaluate(() => document.documentElement.dir)).toBe("rtl");

    await page.getByTestId("hero-cta").click();
    await expect(page.getByTestId("buy-qty-step")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("اتصال کیف پول")).toBeVisible();
    const body = await page.evaluate(() => document.body.innerText);
    for (const key of ["buySheetTitle", "connectWalletTitle", "maxCta"]) {
      expect(body).not.toContain(key);
    }
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/slice-g/buy-connect-fa.png", fullPage: false });
  });
});

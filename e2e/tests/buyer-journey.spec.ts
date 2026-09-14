// Slice 6 — first-time buyer journey spine at 480×840 (config).
//
// One coherent path, client-side navigation only (demo state is in-session):
// marketplace card answers price/income/fraction → detail hero answers price,
// fraction, CTA → Estate explains the ANR plainly → Income shows the chain →
// Ownership states the risks → the buy entry gates honestly on the wallet.
// The cancel-confirm copy states the honest outcome (no investing-balance fiction).
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

test.describe("Buyer journey — discovery to action explains itself (LTR)", () => {
  test("marketplace → detail → tabs → honest buy entry", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/marketplace");
    await page.waitForSelector('[data-testid="estates-page"]', { timeout: 15_000 });

    // 1–2. Card answers price, income, fraction, and the next step.
    const card = page.getByTestId("property-card").first();
    await expect(card).toContainText("$100.00");
    await expect(card).toContainText("$16.29");
    await expect(card).toContainText("1 share");
    await expect(card).toContainText("View Estate");
    await card.click();
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    // 3. Hero answers price, fraction, and the single action.
    await expect(page.getByTestId("hero-price")).toContainText("$100.00");
    await expect(page.getByTestId("hero-fraction")).toContainText("1 share");
    await expect(page.getByTestId("hero-cta")).toContainText("Buy");
    await expectNoOverflow(page);

    // 4. Economics: the ANR explains itself in plain language.
    await expect(page.getByTestId("thesis-anr-note")).toContainText(/revenue model/i);

    // Income tab carries the chain; Ownership states the risks.
    await page.getByTestId("tab-income").click();
    await expect(page.getByTestId("income-v1-basis")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("tab-ownership").click();
    await expect(page.getByText(/not guaranteed/)).toBeVisible({ timeout: 10_000 });
    await expectNoOverflow(page);

    // 7. The buy entry gates honestly without a wallet in the browser.
    await page.getByTestId("hero-cta").click();
    await expect(page.getByTestId("buy-qty-step")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Connect wallet")).toBeVisible();
    await expectNoOverflow(page);
  });

  test("cancel confirm states the honest outcome (no investing-balance fiction)", async ({
    page,
  }) => {
    await skipOnboarding(page);
    // Open the cancel sheet for the seeded order WITHOUT confirming (no state change).
    await page.goto("/portfolio");
    await page.waitForSelector('[data-testid="portfolio-page"]', { timeout: 15_000 });
    const block = page.getByTestId("open-orders");
    await expect(block).toBeVisible({ timeout: 10_000 });
    await page
      .getByRole("button", { name: "Cancel order sell 10 shares" })
      .click();
    await expect(page.getByTestId("cancel-order-confirm")).toBeVisible({ timeout: 10_000 });
    const sheet = await page.getByTestId("cancel-order-confirm").innerText();
    expect(sheet).toMatch(/nothing will be bought or sold/i);
    expect(sheet.toLowerCase()).not.toContain("investing balance");
    await expectNoOverflow(page);
  });
});

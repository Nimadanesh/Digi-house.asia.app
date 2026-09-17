import { test, expect, type Page } from "@playwright/test";

// Card page slice — viewport is 480×840 (config).

/** Skip the onboarding carousel so the app shell unlocks (settings store persists). */
async function skipOnboarding(page: Page) {
  await page.goto("/");
  const skip = page.getByTestId("onboarding-skip");
  await skip.waitFor({ state: "visible", timeout: 20_000 });
  await skip.click();
  // complete() — router.replace(/home) once onboarded is persisted.
  await page.waitForURL("**/home", { timeout: 15_000 });
}

test.describe("Card page", () => {
  test("composition, live Home balance, close returns Home, no horizontal overflow", async ({
    page,
  }) => {
    await skipOnboarding(page);
    await page.goto("/home");
    await page.waitForSelector('[data-testid="home-page"]', { timeout: 15_000 });
    const heroAmount = (await page.getByTestId("home-hero-amount").textContent())?.trim();
    expect(heroAmount).toBeTruthy();

    // Home Card action navigates to the Card page.
    await page.getByTestId("action-card").click();
    await page.waitForSelector('[data-testid="card-page"]', { timeout: 15_000 });

    // Reference composition: badge, headline, live balance, brand, benefits, CTA.
    await expect(page.getByTestId("card-badge")).toHaveText("New class Asset");
    await expect(page.getByRole("heading", { name: "Own your credit card" })).toBeVisible();
    // Same source as Home: the card balance equals the Home hero amount.
    await expect(page.getByTestId("card-balance")).toHaveText(heroAmount as string);
    await expect(page.getByTestId("card-preview")).toContainText("F.Luxe");
    await expect(page.getByTestId("card-benefits")).toContainText("Track your balance in one place");
    await expect(page.getByTestId("card-benefits")).toContainText("Access your fractional portfolio");
    await expect(page.getByTestId("card-benefits")).toContainText("Unlock premium card benefits");
    await expect(page.getByTestId("card-cta")).toHaveText("Get Your F.Luxe Card");
    await expect(page.getByText("Secure payment. Cancel anytime.")).toBeVisible();

    // Card and CTA are laid out without clipping at 480 wide.
    for (const id of ["card-preview", "card-cta", "card-close"]) {
      const box = await page.getByTestId(id).boundingBox();
      expect(box, id).not.toBeNull();
      expect(box!.x, `${id} x`).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, `${id} right`).toBeLessThanOrEqual(480);
    }

    // No horizontal overflow at 480×840.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);

    await page.screenshot({
      path: "screenshots/runs/card/card-page.png",
      fullPage: false,
    });

    // Close returns to Home.
    await page.getByTestId("card-close").click();
    await page.waitForSelector('[data-testid="home-page"]', { timeout: 15_000 });
  });
});

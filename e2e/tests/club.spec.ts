import { test, expect, type Page } from "@playwright/test";

// Club page slice — viewport is 480×840 (config).

/** Skip the onboarding carousel so the app shell unlocks (settings store persists). */
async function skipOnboarding(page: Page) {
  await page.goto("/");
  const skip = page.getByTestId("onboarding-skip");
  await skip.waitFor({ state: "visible", timeout: 20_000 });
  await skip.click();
  // complete() — router.replace(/home) once onboarded is persisted.
  await page.waitForURL("**/home", { timeout: 15_000 });
}

test.describe("Club page", () => {
  test("home Club action → /club composition, sheet, no overflow", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/home");
    await page.waitForSelector('[data-testid="home-page"]', { timeout: 15_000 });

    // Home third action navigates to the Club page.
    await page.getByTestId("action-club").click();
    await page.waitForSelector('[data-testid="club-page"]', { timeout: 15_000 });

    // First viewport answers: membership, unlocked, usable, next.
    await expect(page.getByTestId("podium-headline")).toHaveText("Shine like stars");
    await expect(page.getByTestId("club-header")).toHaveCount(0);
    await expect(page.getByTestId("club-card")).toBeVisible();
    await expect(page.getByTestId("club-benefits")).toBeVisible();
    expect(await page.getByTestId("club-benefit").count()).toBe(6);
    await expect(page.getByTestId("club-next-unlock")).toContainText("Explore Estates");
    expect(await page.getByTestId("club-tier").count()).toBe(5);

    // Benefit tile opens the detail sheet (progressive disclosure).
    await page.getByTestId("club-benefit").first().click();
    await page.waitForSelector('[data-testid="sheet-panel"]', { timeout: 10_000 });
    await expect(page.getByTestId("sheet-panel")).toContainText("What it is");
    await page.keyboard.press("Escape");

    // Escape + referral experience sections.
    await expect(page.getByTestId("club-escape")).toContainText(
      "Give someone special an unforgettable experience.",
    );
    await page.getByTestId("club-escape-cta").click();
    await page.waitForSelector('[data-testid="sheet-panel"]', { timeout: 10_000 });
    expect(await page.getByTestId("escape-occasion").count()).toBe(5);
    await expect(page.getByTestId("sheet-panel")).toContainText("The destination");
    await page.keyboard.press("Escape");
    // Luxe Circle: honest empty network, no ladder duplicated from the Hub.
    await expect(page.getByTestId("club-circle")).toContainText("Your Luxe Circle");
    await expect(page.getByTestId("circle-counts")).toContainText("0 Members");
    await expect(page.getByTestId("circle-shared-empty")).toContainText("No shared properties yet.");
    await expect(page.getByTestId("club-referral")).toContainText("Open Referral");
    await expect(page.getByTestId("club-referral-progress")).toHaveCount(0);

    // No horizontal overflow at 480×840.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);

    await page.screenshot({
      path: "screenshots/runs/club/club-page.png",
      fullPage: false,
    });
  });

  test("/card still renders as a direct route", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/card");
    await page.waitForSelector('[data-testid="card-page"]', { timeout: 15_000 });
    await expect(page.getByTestId("card-cta")).toHaveText("Get Your F.Luxe Card");
  });

  test("touchpoints: marketplace chip, estate block, portfolio strip", async ({ page }) => {
    await skipOnboarding(page);

    await page.goto("/marketplace");
    await page.waitForSelector('[data-testid="estates-list"]', { timeout: 15_000 });
    await expect(page.getByTestId("card-club-chip").first()).toContainText("Club Experience");

    await page.getByTestId("property-card").first().click();
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });
    await expect(page.getByTestId("club-estate-block")).toContainText("Private Member Benefit");

    await page.goto("/portfolio");
    await page.waitForSelector('[data-testid="portfolio-page"]', { timeout: 15_000 });
    await expect(page.getByTestId("club-portfolio-strip")).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test("cross-app flow: all six surfaces render without overflow", async ({ page }) => {
    await skipOnboarding(page);
    const shots: Array<[string, string, string]> = [
      ["/home", "home-page", "flow-home"],
      ["/club", "club-page", "flow-club"],
      ["/marketplace", "estates-page", "flow-marketplace"],
      ["/portfolio", "portfolio-page", "flow-portfolio"],
      ["/card", "card-page", "flow-card"],
    ];
    for (const [route, id, shot] of shots) {
      await page.goto(route);
      await page.waitForSelector(`[data-testid="${id}"]`, { timeout: 15_000 });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow, route).toBe(false);
      await page.screenshot({ path: `screenshots/runs/club/${shot}.png`, fullPage: false });
    }
    // Estate via marketplace card (dynamic id).
    await page.goto("/marketplace");
    await page.waitForSelector('[data-testid="estates-list"]', { timeout: 15_000 });
    await page.getByTestId("property-card").first().click();
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow, "estate").toBe(false);
    await page.screenshot({ path: "screenshots/runs/club/flow-estate.png", fullPage: false });
  });
});

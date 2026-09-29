import { test, expect, type Page } from "@playwright/test";

// Referral Hub V2 — /referral is the single referral destination.

/** Skip the onboarding carousel so the app shell unlocks (settings store persists). */
async function skipOnboarding(page: Page) {
  await page.goto("/");
  const skip = page.getByTestId("onboarding-skip");
  await skip.waitFor({ state: "visible", timeout: 20_000 });
  await skip.click();
  // complete() → router.replace(/home) once onboarded is persisted.
  await page.waitForURL("**/home", { timeout: 15_000 });
}

async function expectNoOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
}

test.describe("Referral Hub — routing and dual model", () => {
  test("Home Invite routes to /referral (never Settings)", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/home");
    await page.waitForSelector('[data-testid="home-page"]', { timeout: 15_000 });

    await page.getByTestId("action-invite").click();
    await page.waitForURL("**/referral", { timeout: 15_000 });

    await expect(page.getByTestId("referral-page")).toBeVisible();
    // Fresh-load first viewport: label, headline, explanation, switcher, model start, CTA.
    await page.screenshot({
      path: "screenshots/runs/referral-hub/hero-fresh-mobile.png",
      fullPage: false,
    });
    await expect(page.getByTestId("referral-hero")).toBeVisible();
    await expect(page.getByText("Invite. Grow. Unlock more.")).toBeVisible();
    await expect(page.getByTestId("referral-switcher")).toBeVisible();
    // Settings sheet is not the destination.
    await expect(page.getByTestId("settings-sheet")).toHaveCount(0);
    // Standard content starts in the first viewport area (select explicitly —
    // the default tab follows the member's portfolio tier).
    await page.getByTestId("referral-tab-standard").click();
    await expect(page.getByTestId("referral-standard-view")).toBeVisible();
    await expect(page.getByTestId("referral-ladder")).toBeVisible();
    await expect(page.getByTestId("referral-cta-invite")).toBeVisible();

    await expectNoOverflow(page);
    await page.screenshot({
      path: "screenshots/runs/referral-hub/standard-mobile.png",
      fullPage: false,
    });
  });

  test("Switcher toggles Standard and Club views with separated models", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/referral");
    await page.waitForSelector('[data-testid="referral-page"]', { timeout: 15_000 });

    // Standard: 3-band ladder + custom note, no points.
    await page.getByTestId("referral-tab-standard").click();
    await expect(page.getByTestId("referral-tab-standard")).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("referral-band")).toHaveCount(3);
    await expect(page.getByTestId("referral-custom-note")).toContainText(/contact club/i);

    // Club: progress + 5-milestone ladder + stay + Plus layer, no dollar rewards.
    await page.getByTestId("referral-tab-club").click();
    await expect(page.getByTestId("referral-club-view")).toBeVisible();
    await expect(page.getByTestId("referral-club-progress")).toBeVisible();
    await expect(page.getByTestId("referral-milestone")).toHaveCount(5);
    await expect(page.getByTestId("referral-stay")).toBeVisible();
    await expect(page.getByTestId("referral-plus")).toBeVisible();
    await expect(page.getByTestId("referral-club-cta")).toBeVisible();
    await expect(page.getByTestId("referral-balance")).toHaveCount(0);

    await expectNoOverflow(page);
    await page.screenshot({
      path: "screenshots/runs/referral-hub/club-mobile.png",
      fullPage: false,
    });

    // Back to Standard; the prototype CTA either copies (signed-in) or honestly
    // asks for sign-in (anonymous dev session) — either way it stays put.
    await page.getByTestId("referral-tab-standard").click();
    await expect(page.getByTestId("referral-standard-view")).toBeVisible();
    const invite = page.getByTestId("referral-cta-invite");
    await expect(invite).toBeVisible();
    if (await invite.isEnabled()) {
      await invite.click();
      await page.waitForTimeout(300);
      expect(page.url()).toContain("/referral");
    } else {
      await expect(invite).toContainText(/sign in/i);
    }
  });

  test("Club Referral CTA routes to /referral (never Settings)", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/club");
    await page.waitForSelector('[data-testid="club-page"]', { timeout: 15_000 });

    await expect(page.getByTestId("club-referral-cta")).toBeVisible();
    await page.getByTestId("club-referral-cta").click();
    await page.waitForURL("**/referral", { timeout: 15_000 });
    await expect(page.getByTestId("referral-page")).toBeVisible();
    await expect(page.getByTestId("settings-sheet")).toHaveCount(0);

    await expectNoOverflow(page);
  });

  test("Desktop 1280×800: premium composition, no overflow", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await skipOnboarding(page);
    await page.goto("/referral");
    await page.waitForSelector('[data-testid="referral-page"]', { timeout: 15_000 });

    await expect(page.getByTestId("referral-hero")).toBeVisible();
    await page.screenshot({
      path: "screenshots/runs/referral-hub/hero-fresh-desktop.png",
      fullPage: false,
    });
    await expect(page.getByTestId("referral-switcher")).toBeVisible();
    await page.getByTestId("referral-tab-standard").click();
    await expect(page.getByTestId("referral-standard-view")).toBeVisible();
    await page.getByTestId("referral-tab-club").click();
    await expect(page.getByTestId("referral-club-view")).toBeVisible();

    await expectNoOverflow(page);
    await page.screenshot({
      path: "screenshots/runs/referral-hub/club-desktop.png",
      fullPage: false,
    });
  });
});

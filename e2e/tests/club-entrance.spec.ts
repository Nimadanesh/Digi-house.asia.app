import { test, expect, type Page } from "@playwright/test";

// Club entrance experience — additive overlay; viewport is 480×840 (config).

/** Skip the onboarding carousel so the app shell unlocks (settings store persists). */
async function skipOnboarding(page: Page) {
  await page.goto("/");
  const skip = page.getByTestId("onboarding-skip");
  await skip.waitFor({ state: "visible", timeout: 20_000 });
  await skip.click();
  await page.waitForURL("**/home", { timeout: 15_000 });
}

test.describe("Club entrance experience", () => {
  test("no Club-page flash: the entrance is the first visible state after tapping Club", async ({
    page,
  }) => {
    await skipOnboarding(page);
    await page.waitForSelector('[data-testid="home-page"]', { timeout: 15_000 });

    // Watch frame-by-frame: flag if /club is ever painted before the entrance.
    await page.evaluate(() => {
      const w = window as unknown as { __clubFlash?: boolean; __clubStop?: boolean };
      w.__clubFlash = false;
      w.__clubStop = false;
      const check = () => {
        if (w.__clubStop) return;
        if (document.querySelector('[data-testid="club-entrance"]')) {
          w.__clubStop = true;
          return;
        }
        if (document.querySelector('[data-testid="club-page"]')) w.__clubFlash = true;
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });

    await page.getByTestId("action-club").click();
    await page.waitForSelector('[data-testid="club-entrance"]', { timeout: 8_000 });

    const flashed = await page.evaluate(
      () => (window as unknown as { __clubFlash?: boolean }).__clubFlash === true,
    );
    expect(flashed).toBe(false);
  });

  test("Home → Club plays the entrance, then reveals the Club page", async ({ page }) => {
    await skipOnboarding(page);
    await page.waitForSelector('[data-testid="home-page"]', { timeout: 15_000 });

    await page.getByTestId("action-club").click();

    // The decorative overlay appears on entry…
    await page.waitForSelector('[data-testid="club-entrance"]', { timeout: 8_000 });
    // …while the existing Club page renders underneath (curtain, not a blocker).
    await page.waitForSelector('[data-testid="club-page"]', { timeout: 15_000 });

    // It removes itself (failsafe) and the Club page stays reachable.
    await page.waitForSelector('[data-testid="club-entrance"]', {
      state: "detached",
      timeout: 16_000,
    });
    await expect(page.getByTestId("club-page")).toBeVisible();
    await expect(page.getByTestId("club-header")).toHaveCount(0);
    // The same atmosphere persists as the Club background layer.
    await expect(page.getByTestId("club-ambient")).toBeAttached();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test("direct /club access does not replay the entrance", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/club");
    await page.waitForSelector('[data-testid="club-page"]', { timeout: 15_000 });
    await page.waitForTimeout(600);
    await expect(page.getByTestId("club-entrance")).toHaveCount(0);
  });

  test("responsive: composition holds across target viewports", async ({ page }) => {
    test.setTimeout(180_000);
    await skipOnboarding(page);
    const sizes = [
      { w: 375, h: 812 },
      { w: 390, h: 844 },
      { w: 430, h: 932 },
      { w: 480, h: 840 },
      { w: 1280, h: 800 },
    ];
    for (const size of sizes) {
      await page.setViewportSize({ width: size.w, height: size.h });
      // Fresh load resets the one-shot signal so each viewport can be exercised.
      await page.goto("/home");
      await page.waitForSelector('[data-testid="home-page"]', { timeout: 15_000 });
      await page.getByTestId("action-club").click();
      await page.waitForSelector('[data-testid="club-entrance"]', { timeout: 8_000 });

      const overlay = await page.getByTestId("club-entrance").boundingBox();
      expect(overlay, `overlay@${size.w}`).not.toBeNull();
      expect(overlay!.width).toBeGreaterThanOrEqual(size.w - 1);

      for (const sel of ["h2", "p"]) {
        const box = await page.locator(`[data-testid="club-entrance"] ${sel}`).boundingBox();
        expect(box, `${sel}@${size.w}`).not.toBeNull();
        expect(box!.x, `${sel}@${size.w} left`).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width, `${sel}@${size.w} right`).toBeLessThanOrEqual(size.w + 1);
      }

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow, `overflow@${size.w}`).toBe(false);

      await page.screenshot({ path: `screenshots/runs/club-entrance/${size.w}x${size.h}.png` });
      await page.waitForSelector('[data-testid="club-entrance"]', { state: "detached", timeout: 16_000 });
    }
  });

  test("reduced motion: a short still entrance, then the Club page", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await skipOnboarding(page);
    await page.waitForSelector('[data-testid="home-page"]', { timeout: 15_000 });
    await page.getByTestId("action-club").click();
    await page.waitForSelector('[data-testid="club-entrance"]', { timeout: 8_000 });
    await page.waitForSelector('[data-testid="club-entrance"]', { state: "detached", timeout: 6_000 });
    await expect(page.getByTestId("club-page")).toBeVisible();
  });
});

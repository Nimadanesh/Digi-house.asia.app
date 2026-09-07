// Ownership charts touch interaction — mobile tap selects persistently.
// A tap must show the detail, survive finger lift (>2s), move on the next tap,
// and toggle off on re-tap. Desktop hover stays transient. No chart data,
// economics, or visuals are asserted beyond the selection contract.
import { test, expect, type Page } from "@playwright/test";

const PROP = "/property/prop-marina-vista-4b";

async function openOwnership(page: Page) {
  await page.goto("/");
  const skip = page.getByTestId("onboarding-skip");
  await skip.waitFor({ state: "visible", timeout: 20_000 });
  await skip.click();
  await page.waitForURL("**/home", { timeout: 15_000 });
  await page.goto(PROP);
  await page.getByTestId("property-hero").waitFor({ timeout: 20_000 });
  await page.getByTestId("tab-ownership").click();
  await page.getByTestId("holder-analytics").waitFor({ timeout: 20_000 });
}

test.describe("Ownership charts touch selection", () => {
  test.use({ hasTouch: true, isMobile: true });

  test("donut: tap persists, moves, toggles off", async ({ page }) => {
    await openOwnership(page);
    const svg = page.getByTestId("holder-donut-svg");
    await svg.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const box = await svg.boundingBox();
    if (!box) throw new Error("donut svg has no box");
    // Segment 0 always starts at 12 o'clock; tap just clockwise of it.
    const ring = (96 + 62) / 2 / 220;
    const pt = (deg: number) => {
      const a = (deg * Math.PI) / 180;
      return {
        x: box.x + box.width * (0.5 + ring * Math.sin(a)),
        y: box.y + box.height * (0.5 - ring * Math.cos(a)),
      };
    };
    const tip = page.getByTestId("donut-tooltip");
    const hint = await tip.textContent();
    const p1 = pt(10);
    await page.touchscreen.tap(p1.x, p1.y);
    await expect.poll(() => tip.textContent(), { timeout: 5_000 }).not.toBe(hint);
    const first = await tip.textContent();
    await page.waitForTimeout(2200);
    await expect.poll(() => tip.textContent(), { timeout: 5_000 }).toBe(first);
    const p2 = pt(200);
    await page.touchscreen.tap(p2.x, p2.y);
    await expect.poll(() => tip.textContent(), { timeout: 5_000 }).not.toBe(first);
    await page.touchscreen.tap(p2.x, p2.y);
    await expect.poll(() => tip.textContent(), { timeout: 5_000 }).toBe(hint);
  });

  test("treemap + distribution: tap persists and moves, no overflow", async ({ page }) => {
    await openOwnership(page);
    const treeTip = page.getByTestId("treemap-tooltip");
    const treeHint = await treeTip.textContent();
    const cellA = page.getByTestId("treemap-cell-A");
    await cellA.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await cellA.tap();
    await expect.poll(() => treeTip.textContent(), { timeout: 5_000 }).not.toBe(treeHint);
    const first = await treeTip.textContent();
    await page.waitForTimeout(2200);
    await expect.poll(() => treeTip.textContent(), { timeout: 5_000 }).toBe(first);

    const distTip = page.getByTestId("distribution-tooltip");
    const zone = page.getByTestId("chart-hit-10");
    await zone.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await zone.tap();
    // NOTE: the marker is a zero-area SVG line — assert attachment, not visibility.
    await expect.poll(
      () => page.getByTestId("distribution-selected-marker").count(),
      { timeout: 5_000 },
    ).toBe(1);
    const dFirst = await distTip.textContent();
    await page.waitForTimeout(2200);
    await expect.poll(() => distTip.textContent(), { timeout: 5_000 }).toBe(dFirst);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });

  test("bubble: tap selects nearest center and persists", async ({ page }) => {
    await openOwnership(page);
    const svg = page.getByTestId("bubble-svg");
    await svg.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const box = await svg.boundingBox();
    if (!box) throw new Error("bubble svg has no box");
    const centerOf = (id: string) =>
      page.getByTestId(id).locator('circle[fill]:not([fill="transparent"])').first().evaluate(
        (el, b) => ({
          x: b.x + (parseFloat(el.getAttribute("cx") ?? "0") / 440) * b.width,
          y: b.y + (parseFloat(el.getAttribute("cy") ?? "0") / 220) * b.height,
        }),
        box,
      );
    const tip = page.getByTestId("bubble-tooltip");
    const hint = await tip.textContent();
    const p = await centerOf("bubble-A");
    await page.touchscreen.tap(p.x, p.y);
    await expect.poll(() => tip.textContent(), { timeout: 5_000 }).not.toBe(hint);
    const first = await tip.textContent();
    await page.waitForTimeout(2200);
    await expect.poll(() => tip.textContent(), { timeout: 5_000 }).toBe(first);
  });
});

test.describe("Ownership charts touch selection (RTL)", () => {
  test.use({ hasTouch: true, isMobile: true, locale: "fa-IR" });

  test("fa: tap selects persistently, no overflow, no raw keys", async ({ page }) => {
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
    await page.goto(PROP);
    await page.getByTestId("property-detail").waitFor({ timeout: 15_000 });
    expect(await page.evaluate(() => document.documentElement.dir)).toBe("rtl");
    await page.getByTestId("tab-ownership").click();
    await page.getByTestId("holder-analytics").waitFor({ timeout: 20_000 });
    const tip = page.getByTestId("treemap-tooltip");
    const hint = await tip.textContent();
    const cell = page.getByTestId("treemap-cell-A");
    await cell.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await cell.tap();
    await expect.poll(() => tip.textContent(), { timeout: 5_000 }).not.toBe(hint);
    const first = await tip.textContent();
    await page.waitForTimeout(2200);
    await expect.poll(() => tip.textContent(), { timeout: 5_000 }).toBe(first);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

test.describe("Ownership charts desktop hover", () => {
  test("hover shows and leave clears (no regression)", async ({ page }) => {
    await openOwnership(page);
    const cell = page.getByTestId("treemap-cell-A");
    await cell.evaluate((el) => el.scrollIntoView({ block: "center" }));
    // Park the mouse neutrally first — scrolling can leave it hovering the cell.
    await page.mouse.move(10, 10);
    const tip = page.getByTestId("treemap-tooltip");
    const hint = await tip.textContent();
    await cell.hover();
    await expect.poll(() => tip.textContent(), { timeout: 5_000 }).not.toBe(hint);
    await page.mouse.move(10, 10);
    await expect.poll(() => tip.textContent(), { timeout: 5_000 }).toBe(hint);
  });
});

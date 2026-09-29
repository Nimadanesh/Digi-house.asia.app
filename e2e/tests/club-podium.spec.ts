import { test, expect, type Page } from "@playwright/test";

// Club tier podium slice — the redesigned Club header (three-card gradient
// tier stack). Viewport is 480×840 (config) unless a test overrides it.

/** Skip the onboarding carousel so the app shell unlocks. */
async function skipOnboarding(page: Page) {
  await page.goto("/");
  const skip = page.getByTestId("onboarding-skip");
  await skip.waitFor({ state: "visible", timeout: 20_000 });
  await skip.click();
  await page.waitForURL("**/home", { timeout: 15_000 });
}

type Box = { x: number; y: number; width: number; height: number };

async function podiumBoxes(page: Page): Promise<Record<string, Box>> {
  const ids = ["podium-card-elite", "podium-card-signature", "podium-card-private-plus"];
  const out: Record<string, Box> = {};
  for (const id of ids) {
    const box = await page.getByTestId(id).boundingBox();
    expect(box, id).not.toBeNull();
    out[id] = box as Box;
  }
  return out;
}

test.describe("Club tier podium", () => {
  test("composition: overlap, center dominance, no overflow", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/club");
    await page.waitForSelector('[data-testid="club-page"]', { timeout: 15_000 });

    // Headline + tagline copy.
    await expect(page.getByTestId("podium-headline")).toHaveText("Shine like stars");
    await expect(page.getByTestId("podium-tagline")).toHaveText(
      "A private circle for those who refuse to be ordinary.",
    );

    const b = await podiumBoxes(page);
    const elite = b["podium-card-elite"];
    const sig = b["podium-card-signature"];
    const priv = b["podium-card-private-plus"];

    // Elite on the left, Private+ on the right, Signature centered between them.
    const centerL = sig.x + sig.width / 2;
    expect(Math.abs(centerL - 480 / 2)).toBeLessThanOrEqual(4);

    // Layered composition: side cards emerge from behind the hero on their
    // own side (bounding boxes overlap the hero's), centers ordered.
    expect(elite.x + elite.width).toBeGreaterThan(sig.x + 1);
    expect(priv.x).toBeLessThan(sig.x + sig.width - 1);
    expect(elite.x).toBeLessThan(sig.x);
    expect(sig.x + sig.width).toBeLessThan(priv.x + priv.width);

    // Physical overlap: side cards extend behind the hero on both sides.
    expect(elite.x + elite.width).toBeGreaterThan(sig.x + 1);
    expect(priv.x).toBeLessThan(sig.x + sig.width - 1);

    // Side cards visibly smaller (scale ~0.92).
    expect(elite.width).toBeLessThan(sig.width);
    expect(priv.width).toBeLessThan(sig.width);
    expect(elite.width / sig.width).toBeGreaterThan(0.85);
    expect(elite.width / sig.width).toBeLessThan(0.99);

    // Gentle rotations only (|angle| ≤ 7°).
    const angles = await page.evaluate(() => {
      const get = (sel: string) =>
        getComputedStyle(document.querySelector(sel) as Element).transform;
      const angleOf = (m: string) => {
        if (m === "none") return 0;
        const v = m.match(/matrix\(([^)]+)\)/);
        if (!v) return 0;
        // matrix(a, b, c, d, e, f) → rotation = atan2(b, a).
        const [a, b] = v[1].split(",").map(Number);
        return (Math.atan2(b, a) * 180) / Math.PI;
      };
      return {
        elite: angleOf(get('[data-testid="podium-card-elite"]')),
        priv: angleOf(get('[data-testid="podium-card-private-plus"]')),
      };
    });
    expect(Math.abs(angles.elite)).toBeGreaterThan(2);
    expect(Math.abs(angles.elite)).toBeLessThanOrEqual(7);
    expect(Math.abs(angles.priv)).toBeGreaterThan(2);
    expect(Math.abs(angles.priv)).toBeLessThanOrEqual(7);

    // Cards stay inside the viewport (no clipping / horizontal scroll).
    for (const [id, box] of Object.entries({ elite, sig, priv })) {
      expect(box.x, `${id} left`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `${id} right`).toBeLessThanOrEqual(480);
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test("z-order + gradient identity: Signature reads as the dominant object", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/club");
    await page.waitForSelector('[data-testid="club-page"]', { timeout: 15_000 });

    const z = await page.evaluate(() => {
      const zOf = (sel: string) =>
        Number(getComputedStyle(document.querySelector(sel) as Element).zIndex);
      const bg = (sel: string) =>
        getComputedStyle(document.querySelector(sel) as Element).backgroundImage;
      return {
        elite: zOf('[data-testid="podium-card-elite"]'),
        sig: zOf('[data-testid="podium-card-signature"]'),
        priv: zOf('[data-testid="podium-card-private-plus"]'),
        sigBg: bg('[data-testid="podium-card-signature"]'),
        eliteBg: bg('[data-testid="podium-card-elite"]'),
        privBg: bg('[data-testid="podium-card-private-plus"]'),
      };
    });
    expect(z.sig).toBeGreaterThan(z.elite);
    expect(z.sig).toBeGreaterThan(z.priv);

    // Multi-stop gradient families (computed as rgb()/rgba() in Chrome, not
    // Tailwind presets): Signature = champagne/gold, Elite = rose/mauve,
    // Private+ = sapphire. Radial stop + linear stops per family.
    expect(z.sigBg).toContain("rgba(255, 245, 205");
    expect(z.sigBg).toContain("rgba(247, 217, 140");
    expect(z.eliteBg).toContain("rgba(201, 130, 166");
    expect(z.eliteBg).toContain("rgba(51, 41, 67");
    expect(z.privBg).toContain("rgba(49, 94, 145");
    expect(z.privBg).toContain("rgba(12, 28, 50");
  });

  test("progress stays owned by the membership card, not the podium", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/club");
    await page.waitForSelector('[data-testid="club-page"]', { timeout: 15_000 });

    const card = await page.getByTestId("club-card").boundingBox();
    const progress = await page.getByTestId("club-card-progress").boundingBox();
    expect(card).not.toBeNull();
    expect(progress).not.toBeNull();
    // Directly underneath the membership card.
    expect(progress!.y).toBeGreaterThanOrEqual(card!.y + card!.height - 2);
    // And below the podium (not attached to it).
    const podium = await page.getByTestId("club-podium").boundingBox();
    expect(progress!.y).toBeGreaterThan(podium!.y + podium!.height);

    // Existing hierarchy intact: hero podium → support text → membership card.
    const ids = ["club-podium", "club-card", "club-card-progress"];
    const els = [] as Array<{ y: number }>;
    for (const id of ids) {
      const box = (await page.getByTestId(id).boundingBox()) as Box | null;
      expect(box, id).not.toBeNull();
      els.push(box as Box);
    }
    expect(els[1]!.y).toBeGreaterThan(els[0]!.y);
    expect(els[2]!.y).toBeGreaterThan(els[1]!.y);
  });

  test("scroll collapse: side cards fold toward the hero smoothly", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/club");
    await page.waitForSelector('[data-testid="club-page"]', { timeout: 15_000 });

    const before = await podiumBoxes(page);
    const beforeAngle = await page.evaluate(
      () => getComputedStyle(document.querySelector('[data-testid="podium-card-elite"]') as Element).transform,
    );

    // Scroll past the header so the collapse progresses (deterministic
    // programmatic scroll — wheel dispatch is unreliable in headless runs).
    await page.evaluate(() => window.scrollTo({ top: 700 }));
    await page.waitForTimeout(250);

    const after = await podiumBoxes(page);
    const afterAngle = await page.evaluate(
      () => getComputedStyle(document.querySelector('[data-testid="podium-card-elite"]') as Element).transform,
    );

    // Side cards moved toward the center (reduced horizontal offset).
    const spread = (b: Record<string, Box>) =>
      (b["podium-card-private-plus"].x - b["podium-card-elite"].x);
    expect(spread(after)).toBeLessThan(spread(before));
    // Rotation eased toward flat.
    expect(afterAngle).not.toBe(beforeAngle);

    // Hero still present; side-card opacity lands in the spec's retreat band.
    await expect(page.getByTestId("podium-card-signature")).toBeVisible();
    const opacity = await page.evaluate(
      () =>
        Number(
          getComputedStyle(document.querySelector('[data-testid="podium-card-elite"]') as Element)
            .opacity,
        ),
    );
    expect(opacity).toBeGreaterThanOrEqual(0.3);
    expect(opacity).toBeLessThanOrEqual(0.6);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test("responsive: composition holds at 375 / 390 / 430 / 480 and desktop", async ({ page }) => {
    test.setTimeout(120_000);
    await skipOnboarding(page);
    for (const size of [
      { w: 375, h: 812 },
      { w: 390, h: 844 },
      { w: 430, h: 932 },
      { w: 480, h: 840 },
      { w: 1280, h: 800 },
    ]) {
      await page.setViewportSize({ width: size.w, height: size.h });
      await page.goto("/club");
      await page.waitForSelector('[data-testid="club-page"]', { timeout: 30_000 });
      await page.waitForTimeout(300);

      const boxes = await podiumBoxes(page);
      const sig = boxes["podium-card-signature"];
      const center = sig.x + sig.width / 2;
      expect(Math.abs(center - size.w / 2), `center@${size.w}`).toBeLessThanOrEqual(4);

      // Hero card substantial but never screen-dominating.
      expect(sig.width, `hero width@${size.w}`).toBeGreaterThan(120);
      expect(sig.width, `hero width@${size.w}`).toBeLessThan(size.w * 0.62);

      // No card clipped; no horizontal scroll.
      for (const [id, box] of Object.entries(boxes)) {
        expect(box.x, `${id} left@${size.w}`).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, `${id} right@${size.w}`).toBeLessThanOrEqual(size.w);
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow, `overflow@${size.w}`).toBe(false);

      await page.screenshot({
        path: `screenshots/runs/club-podium/${size.w}x${size.h}.png`,
        fullPage: false,
      });
    }
  });
});

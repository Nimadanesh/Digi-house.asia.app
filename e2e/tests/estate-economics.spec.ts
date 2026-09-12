// PROMPT 05 QA — V1 canonical economics on Estate Detail at 480×840.
// Grand 2 BDM (full V1 chain) + funding/resale peers (V1 with honest UNKNOWN),
// overflow audit across all three, screenshots for visual review.
import { test, expect, type Page } from "@playwright/test";

async function skipOnboarding(page: Page) {
  await page.goto("/");
  const skip = page.getByTestId("onboarding-skip");
  await skip.waitFor({ state: "visible", timeout: 20_000 });
  await skip.click();
  await page.waitForURL("**/home", { timeout: 15_000 });
}

async function expectNoOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("Prompt 05 — V1 canonical economics QA", () => {
  test("Grand 2 BDM: V1 thesis + $8M single value + investment facts", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/re-128862");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    // PROMPT 05 (DEC-013 form): the hero value row shows the compact $8M single
    // (V1 canonical — never the band, never the full-sentence value line).
    await expect(page.getByTestId("hero-estate-value")).toContainText("Estate value: $8M");
    await expect(page.getByTestId("hero-estate-value")).not.toContainText("10,000,000");
    // V1 thesis: ANR $97,230.25, modeled revenue range, $195.43/yr projected.
    await expect(page.getByTestId("estate-v1-thesis")).toBeVisible();
    await expect(page.getByTestId("thesis-anr")).toContainText("$97,230.25");
    await expect(page.getByTestId("thesis-revenue")).toContainText("$21,390,655.00");
    await expect(page.getByTestId("thesis-revenue")).toContainText("$31,891,522.00");
    await expect(page.getByTestId("thesis-pershare")).toContainText("$195.43");
    // V1 investment: 80,000 shares at $100 (never fixture 2,500 / $80).
    await expect(page.getByTestId("estate-investment")).toBeVisible();
    await expect(page.getByTestId("investment-total-shares")).toContainText("80,000");
    await expect(page.getByTestId("investment-primary-price")).toContainText("$100.00");
    // Legacy Slice A sections never render.
    await expect(page.getByTestId("estate-economics")).toHaveCount(0);
    await expect(page.getByTestId("estate-costs")).toHaveCount(0);
    await expect(page.getByTestId("estate-allocation")).toHaveCount(0);
    // Provenance on demand: no visible wording, tap reveals the explanation.
    await expect(page.getByTestId("thesis-pershare")).not.toContainText("Projected figure");
    await page.getByTestId("thesis-pershare").getByTestId("provenance-info").click();
    await expect(page.getByTestId("provenance-sheet")).toContainText("Projected figure");
    await expect(page.getByTestId("provenance-sheet")).toContainText("Not guaranteed income");
    await page.screenshot({ path: "screenshots/slice-e-qa/provenance-sheet-open.png", fullPage: false });
    // Sheet dismisses via backdrop/Esc like every app sheet — close before continuing.
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("provenance-sheet")).toHaveCount(0);
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/slice-e-qa/grand-estate-tab.png", fullPage: false });

    // Income tab: V1 chain with base gross $26,543,858.25 + 5%/7.5%/1.5% costs.
    await page.getByTestId("tab-income").click();
    await expect(page.getByTestId("income-v1-story")).toBeVisible();
    await expect(page.getByTestId("income-v1-gross")).toContainText("$26,543,858.25");
    await expect(page.getByTestId("income-v1-cost-agency")).toBeVisible();
    await expect(page.getByTestId("income-v1-owner")).toBeVisible();
    await expect(page.getByTestId("income-v1-pershare-annual")).toContainText("$195.43");
    // Scenario pills switch modeled evaluations (optimistic $31,891,522.00).
    await page.getByTestId("scenario-v1-optimistic").click();
    await expect(page.getByTestId("income-v1-gross")).toContainText("$31,891,522.00");
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/slice-e-qa/grand-economics-sections.png", fullPage: false });

    // Ownership tab: V1 decision facts, no simulated holders.
    await page.getByTestId("tab-ownership").click();
    await expect(page.getByTestId("ownership-v1-panel")).toBeVisible();
    await expect(page.getByTestId("ownership-v1-price")).toContainText("$100.00");
    await expect(page.getByTestId("ownership-v1-total")).toContainText("80,000");
    await expect(page.getByTestId("holder-analytics")).toHaveCount(0);
    await expectNoOverflow(page);

    // Reconciled About (Details tab): approved research copy + size; mock
    // facts render as labeled pending rows.
    await page.getByTestId("tab-details").click();
    await page.getByTestId("about-more").click();
    await expect(page.getByTestId("about-details")).toContainText("382 m");
    await expect(page.getByTestId("about-year")).toContainText("Data pending");
    await expect(page.getByTestId("about-lease")).toContainText("Data pending");
    await expect(page.getByTestId("about-valuation")).toContainText("$8M");
    await expectNoOverflow(page);
  });

  test("funding peer (RANGE rate): V1 thesis with known per-share, no legacy shell", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/re-126855");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    // Rental performance leads with the observed nightly display (range kept).
    await expect(page.getByTestId("rental-story-rent")).toContainText("$52,200");
    // V1 thesis renders (Aerial: ANR $64,000, BVI 0% tax → known per-share).
    await expect(page.getByTestId("estate-v1-thesis")).toBeVisible();
    await expect(page.getByTestId("thesis-anr")).toContainText("$64,000.00");
    await expect(page.getByTestId("estate-economics-empty")).toHaveCount(0);
    // V1 investment: 180,000 shares at $100.
    await expect(page.getByTestId("investment-total-shares")).toContainText("180,000");
    await expect(page.getByTestId("hero-estate-value")).toContainText("Estate value: $18M");
    await expect(page.getByTestId("estate-investment")).toBeVisible();
    // Reserve Villa CTA closes the tab with The Aerial's official listing URL.
    const reserve = page.getByTestId("reserve-villa-cta");
    await expect(reserve).toContainText("View & Reserve");
    await expect(reserve).toHaveAttribute(
      "href",
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/british-virgin-islands/buck-island/the-aerial-126855",
    );
    await reserve.scrollIntoViewIfNeeded();
    await page.screenshot({ path: "screenshots/slice-e-qa/peer-funding-reserve.png", fullPage: false });
    await page.getByTestId("estate-v1-thesis").scrollIntoViewIfNeeded();
    await page.screenshot({ path: "screenshots/slice-e-qa/peer-funding-economics.png", fullPage: false });
    // Income pills work for peers with known V1 (Aerial base $17,472,000.00).
    await page.getByTestId("tab-income").click();
    await expect(page.getByTestId("income-v1-gross")).toContainText("$17,472,000.00");
    await expectNoOverflow(page);
    // Peer About carries its own approved research copy (no fixture prose).
    await page.getByTestId("tab-details").click();
    await page.getByTestId("about-more").click();
    await expect(page.getByTestId("about-details")).toContainText("2,787 m");
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/slice-e-qa/peer-funding-estate-tab.png", fullPage: false });
  });

  test("resale peer (DYNAMIC rate): V1 investment at NAV, no legacy market rows", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/re-122903");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    // Reserve Villa CTA carries La Dolce Vita's exact official listing URL.
    const dolceReserve = page.getByTestId("reserve-villa-cta");
    await expect(dolceReserve).toContainText("View & Reserve");
    await expect(dolceReserve).toHaveAttribute(
      "href",
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/turks-and-caicos/providenciales/long-bay/la-dolce-vita--122903",
    );
    await dolceReserve.scrollIntoViewIfNeeded();
    await page.screenshot({ path: "screenshots/slice-e-qa/peer-resale-reserve.png", fullPage: false });
    // La Dolce Vita keeps its DYNAMIC no-rate anchor (never normalized to ADR).
    await expect(page.getByTestId("rental-story-rent")).toContainText("DYNAMIC");
    await expect(page.getByTestId("estate-v1-thesis")).toBeVisible();
    // V1 fractionalization at NAV ($32M → 320,000 shares at $100).
    await expect(page.getByTestId("investment-total-shares")).toContainText("320,000");
    await expect(page.getByTestId("investment-primary-price")).toContainText("$100.00");
    await expectNoOverflow(page);
    await page.getByTestId("estate-v1-thesis").scrollIntoViewIfNeeded();
    await page.screenshot({ path: "screenshots/slice-e-qa/peer-resale-economics.png", fullPage: false });
    await page.screenshot({ path: "screenshots/slice-e-qa/peer-resale-estate-tab.png", fullPage: false });
  });

  test("STARTING_FROM peer: nightly semantics preserved, V1 UNKNOWN stays honest", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/re-128529");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    await expect(page.getByTestId("rental-story-rent")).toContainText("25,000");
    await expect(page.getByTestId("estate-v1-thesis")).toBeVisible();
    // Trajan (USA/Nevada, unknown tax): per-share honestly UNKNOWN.
    await expect(page.getByTestId("thesis-pershare")).toContainText("Data pending");
    await expect(page.getByTestId("estate-investment")).toBeVisible();
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/slice-e-qa/peer-starting-from-estate-tab.png", fullPage: false });
  });

  test("high-value peer: $60M estate value with V1 investment facts", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/re-130397");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    await expect(page.getByTestId("hero-estate-value")).toContainText("Estate value: $60M");
    await expect(page.getByTestId("estate-v1-thesis")).toBeVisible();
    await expect(page.getByTestId("estate-investment")).toBeVisible();
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/slice-e-qa/peer-high-value-estate-tab.png", fullPage: false });
  });

  test("Grand 2 BDM: reserve CTA opens the official listing externally", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/re-128862");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    const reserve = page.getByTestId("reserve-villa-cta");
    await expect(reserve).toBeVisible();
    await expect(reserve).toHaveAttribute(
      "href",
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-asia/maldives/bodufushi/joali-being/grand-2-bdm-ocean-pool-villa-128862",
    );
    // External navigation fires (new tab / external browser in WebView).
    const [popup] = await Promise.all([
      page.waitForEvent("popup", { timeout: 10_000 }),
      reserve.click(),
    ]);
    expect(popup.url()).toContain("rentalescapes.com");
    expect(popup.url()).toContain("128862");
    await popup.close();
  });

  test("closing CTA clears fixed chrome at max scroll (funding + resale)", async ({ page }) => {
    await skipOnboarding(page);
    for (const id of ["re-128862", "re-122113"]) {
      await page.goto(`/property/${id}`);
      await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      // The sticky CTA mounts once the hero scrolls away — wait for the real
      // max-scroll chrome state before measuring (no race with its mount).
      await page.getByTestId("property-sticky-cta").waitFor({ state: "visible", timeout: 10_000 });
      const geo = await page.evaluate(() => {
        const cta = document.querySelector('[data-testid="reserve-villa-cta"]')?.getBoundingClientRect();
        const sticky = document.querySelector('[data-testid="property-sticky-cta"]')?.getBoundingClientRect();
        const tab = document.querySelector('[data-testid="bottom-tab-bar"]')?.getBoundingClientRect();
        return {
          ctaBottom: cta ? Math.round(cta.bottom) : null,
          stickyTop: sticky ? Math.round(sticky.top) : null,
          tabTop: tab ? Math.round(tab.top) : null,
        };
      });
      // The whole CTA sits above every fixed overlay — tappable, not parked beneath…
      expect(geo.ctaBottom, `${id} CTA above sticky`).not.toBeNull();
      if (geo.stickyTop != null) {
        expect(geo.ctaBottom!, `${id} CTA above sticky`).toBeLessThan(geo.stickyTop);
        // …with breathing room but no runaway tail. The bar floats at the
        // viewport bottom (page-enter no longer traps fixed positioning), so the
        // gap is the designed bottom clearance — wider when the tab bar hides
        // behind an active MainButton (buyable pages keep the 88px chrome inset).
        expect(geo.stickyTop - geo.ctaBottom!, `${id} bounded CTA gap`).toBeLessThan(200);
      }
      if (geo.tabTop != null) {
        expect(geo.ctaBottom!, `${id} CTA above tab bar`).toBeLessThan(geo.tabTop);
      }
      await page.screenshot({ path: `screenshots/slice-e-qa/max-scroll-${id}.png`, fullPage: false });
    }
  });

  test("all-24 sweep: V1 architecture, honest states, no overflow", async ({ page }) => {
    test.setTimeout(180_000);
    await skipOnboarding(page);
    const ids = [
      "re-128862",
      "re-126855",
      "re-108924",
      "re-123861",
      "re-125643",
      "re-130393",
      "re-130901",
      "re-131293",
      "re-128529",
      "re-123320",
      "re-109098",
      "re-127825",
      "re-122422",
      "re-129548",
      "re-122903",
      "re-126870",
      "re-130397",
      "re-127483",
      "re-108856",
      "re-108860",
      "re-106441",
      "re-129549",
      "re-123919",
      "re-122113",
    ];
    expect(ids).toHaveLength(24);
    for (const id of ids) {
      await page.goto(`/property/${id}`);
      await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });
      // The V1 Estate architecture renders for every estate…
      await expect(page.getByTestId("rental-story"), `${id} rental performance`).toBeVisible();
      await expect(page.getByTestId("estate-v1-thesis"), `${id} V1 thesis`).toBeVisible();
      await expect(page.getByTestId("estate-investment"), `${id} investment`).toBeVisible();
      // …with no legacy Slice A sections anywhere on the tab…
      await expect(page.getByTestId("estate-economics"), `${id} no legacy economics`).toHaveCount(0);
      await expect(page.getByTestId("estate-costs"), `${id} no legacy costs`).toHaveCount(0);
      await expect(page.getByTestId("estate-allocation"), `${id} no legacy allocation`).toHaveCount(0);
      // …approved ESTIMATED provenance on the hero value…
      await expect(
        page.getByTestId("hero-estate-value").getByTestId("provenance-info"),
        `${id} provenance`,
      ).toHaveAttribute("aria-label", "Estimated value");
      // …reserve CTA closes the tab with an official listing URL (never empty)…
      const reserveCta = page.getByTestId("reserve-villa-cta");
      await expect(reserveCta, `${id} reserve CTA`).toBeVisible();
      await expect(reserveCta, `${id} reserve label`).toContainText("View & Reserve");
      const href = await reserveCta.getAttribute("href");
      expect(href, `${id} official listing URL`).toMatch(/^https:\/\/www\.rentalescapes\.com\/.+-\d+$/);
      // …and no fabricated numbers, no legacy wording, no empty shell.
      await expect(page.getByTestId("estate-economics-empty"), `${id} no empty shell`).toHaveCount(0);
      const thesis = await page.getByTestId("estate-v1-thesis").innerText();
      expect(thesis, `${id} no misleading rent label`).not.toContain("Projected annual rent");
      // …Income carries the four V1 scenario pills…
      await page.getByTestId("tab-income").click();
      await expect(page.getByTestId("scenario-v1-conservative"), `${id} conservative`).toBeVisible();
      await expect(page.getByTestId("scenario-v1-base"), `${id} base`).toBeVisible();
      await expect(page.getByTestId("scenario-v1-optimistic"), `${id} optimistic`).toBeVisible();
      await expect(page.getByTestId("scenario-v1-average"), `${id} average`).toBeVisible();
      // …Ownership carries V1 decision facts with no simulated holders…
      await page.getByTestId("tab-ownership").click();
      await expect(page.getByTestId("ownership-v1-panel"), `${id} ownership V1`).toBeVisible();
      await expect(page.getByTestId("holder-analytics"), `${id} no simulated holders`).toHaveCount(0);
      await expectNoOverflow(page);
    }
  });
});

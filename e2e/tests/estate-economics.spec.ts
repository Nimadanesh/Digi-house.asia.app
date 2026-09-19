// Estate Page Structure QA — V1 canonical economics on Estate Detail @480×840.
// Grand 2 BDM (full V1 chain) + funding/resale/STARTING_FROM/high-value peers
// (V1 with honest UNKNOWN), overflow audits, screenshots for visual review.
// Structure source of truth: docs/design/ESTATE-PAGE-STRUCTURE.md
// (Estate tab §4 = desire sections; Income §5 = the V1 chain with scenario
// cards; Ownership §6 = decision facts; Details §7 = truth sections).
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

test.describe("Estate Page Structure — V1 canonical economics QA", () => {
  test("Grand 2 BDM: §4 desire sections, $8M hero value, §5 V1 chain, §6 decision, §7 truth", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/re-128862");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    // PROMPT 05 (DEC-013 form): the hero value row shows the compact $8M single
    // (V1 canonical — never the band, never the full-sentence value line).
    await expect(page.getByTestId("hero-estate-value")).toContainText("Estate value: $8M");
    await expect(page.getByTestId("hero-estate-value")).not.toContainText("10,000,000");
    // §4 Estate tab: canonical desire sections; thesis/investment/rental-story
    // retired from this tab (economics live on Income/Ownership now).
    await expect(page.getByTestId("estate-why")).toBeVisible();
    await expect(page.getByTestId("estate-specs")).toBeVisible();
    await expect(page.getByTestId("estate-amenities")).toBeVisible();
    await expect(page.getByTestId("estate-location")).toBeVisible();
    // Transfer row is collapsed by default (revision contract) — expand it.
    await page.getByTestId("estate-location-transfer-toggle").click();
    await expect(page.getByTestId("estate-location-transfer")).toContainText("seaplane");
    await expect(page.getByTestId("estate-economics")).toHaveCount(0);
    await expect(page.getByTestId("estate-costs")).toHaveCount(0);
    await expect(page.getByTestId("estate-allocation")).toHaveCount(0);
    await expect(page.getByTestId("estate-v1-thesis")).toHaveCount(0);
    await expect(page.getByTestId("estate-investment")).toHaveCount(0);
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/runs/slice-e-qa/grand-estate-tab.png", fullPage: false });

    // §5 Income tab: V1 chain — basis metric pair (ANR + modeled occupancy),
    // four scenario cards (Base open), expandable costs, not-deducted list,
    // net-income hierarchy card, position income.
    await page.getByTestId("tab-income").click();
    await expect(page.getByTestId("panel-income")).toBeVisible();
    await expect(page.getByTestId("income-basis-anr")).toContainText("$97");
    await expect(page.getByTestId("income-basis")).toContainText("not ADR");
    await expect(page.getByTestId("scenario-cards-base")).toContainText("Base");
    await expect(page.getByTestId("scenario-cards-base")).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("scenario-base-nights")).toContainText("273");
    await expect(page.getByTestId("scenario-base-gross")).toContainText("$26.5M");
    await expect(page.getByTestId("income-costs")).toBeVisible();
    // Provenance on demand (DEC-014): the ⓘ leads the label and the WHOLE row
    // is tappable — the net-distributable row opens its explanation sheet.
    await page.getByTestId("fact-row")
      .filter({ has: page.getByTestId("income-net-amount") })
      .click();
    await expect(page.getByTestId("fact-row-sheet")).toContainText("figure");
    await page.screenshot({ path: "screenshots/runs/slice-e-qa/provenance-sheet-open.png", fullPage: false });
    // Sheet dismisses via backdrop/Esc like every app sheet — close before continuing.
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("fact-row-sheet")).toHaveCount(0);
    // Scenario cards switch modeled evaluations (optimistic $31.9M).
    await page.getByTestId("scenario-cards-optimistic").click();
    await expect(page.getByTestId("scenario-optimistic-gross")).toContainText("$31.9M");
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/runs/slice-e-qa/grand-economics-sections.png", fullPage: false });

    // §6 Ownership tab: valuation 2×2 ($100 reference / 80,000 shares),
    // growth, exit & liquidity, preview, risks — no simulated holders.
    await page.getByTestId("tab-ownership").click();
    await expect(page.getByTestId("panel-ownership")).toBeVisible();
    await expect(page.getByTestId("ownership-valuation-reference")).toContainText("$100.00");
    await expect(page.getByTestId("ownership-valuation-shares")).toContainText("80,000");
    await expect(page.getByTestId("ownership-growth")).toBeVisible();
    await expect(page.getByTestId("ownership-exit")).toBeVisible();
    await expect(page.getByTestId("ownership-risks")).toBeVisible();
    // Revision contract: the position preview moved to the Earn tab.
    await page.getByTestId("tab-earn").click();
    await expect(page.getByTestId("earn-card")).toBeVisible();
    await page.getByTestId("tab-ownership").click();
    await expect(page.getByTestId("holder-analytics")).toHaveCount(0);
    await expectNoOverflow(page);

    // §7 Details tab: truth sections — operator, legal (collapsed rows; expand
    // ownership to reveal the Maldives SPV/head-lease text), pending documents,
    // distribution & tax, historical disclosure (no simulated performance).
    await page.getByTestId("tab-details").click();
    await expect(page.getByTestId("details-operator")).toBeVisible();
    await expect(page.getByTestId("details-operator-name")).toContainText("Amanda Singer");
    await page.getByTestId("details-legal-rows-ownership").click();
    await expect(page.getByTestId("details-legal-rows-ownership-detail")).toContainText("head-lease");
    await expect(page.getByTestId("details-documents-pending")).toBeVisible();
    await expect(page.getByTestId("details-distribution")).toBeVisible();
    await expect(page.getByTestId("details-historical")).toBeVisible();
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/runs/slice-e-qa/grand-details-truth.png", fullPage: false });
  });

  test("funding peer (RANGE rate): desire sections render; V1 income known (no legacy shell)", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/re-126855");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    // §4 desire sections render for every adopted villa (The Aerial).
    await expect(page.getByTestId("estate-why")).toBeVisible();
    await expect(page.getByTestId("estate-location")).toBeVisible();
    await expect(page.getByTestId("estate-economics-empty")).toHaveCount(0);
    // Hero value: $18M single (V1 canonical — never the band).
    await expect(page.getByTestId("hero-estate-value")).toContainText("Estate value: $18M");
    // Reserve Villa CTA closes the tab with The Aerial's official listing URL.
    const reserve = page.getByTestId("reserve-villa-cta");
    await expect(reserve).toContainText("View & Reserve");
    await expect(reserve).toHaveAttribute(
      "href",
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/british-virgin-islands/buck-island/the-aerial-126855",
    );
    await reserve.scrollIntoViewIfNeeded();
    await page.screenshot({ path: "screenshots/runs/slice-e-qa/peer-funding-reserve.png", fullPage: false });
    await page.getByTestId("estate-why").scrollIntoViewIfNeeded();
    await page.screenshot({ path: "screenshots/runs/slice-e-qa/peer-funding-economics.png", fullPage: false });
    // Income: Aerial base gross $17,472,000.00 on the Base card.
    await page.getByTestId("tab-income").click();
    await expect(page.getByTestId("scenario-base-gross")).toContainText("$17.5M");
    await expectNoOverflow(page);
    // Details carry the villa's own locked facts (operator/legal/history).
    await page.getByTestId("tab-details").click();
    await expect(page.getByTestId("details-operator")).toBeVisible();
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/runs/slice-e-qa/peer-funding-estate-tab.png", fullPage: false });
  });

  test("resale peer (DYNAMIC rate): reserve CTA + honest V1 income at NAV", async ({ page }) => {
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
    await page.screenshot({ path: "screenshots/runs/slice-e-qa/peer-resale-reserve.png", fullPage: false });
    // V1 fractionalization at NAV ($32M → 320,000 shares at $100) lives on the
    // Ownership tab now; the Estate tab stays desire-only.
    await page.getByTestId("tab-ownership").click();
    await expect(page.getByTestId("ownership-valuation-shares")).toContainText("320,000");
    await expect(page.getByTestId("ownership-valuation-reference")).toContainText("$100.00");
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/runs/slice-e-qa/peer-resale-economics.png", fullPage: false });
    await page.screenshot({ path: "screenshots/runs/slice-e-qa/peer-resale-estate-tab.png", fullPage: false });
  });

  test("STARTING_FROM peer: nightly semantics preserved; Option 1 FX keeps EUR peer honest in USD", async ({
    page,
  }) => {
    await skipOnboarding(page);
    await page.goto("/property/re-128529");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    // D11 owner-tax table locked 2026-09-13: Nevada = 0% state ASSUMPTION, so
    // Trajan is now full-chain — the Income tab renders the honest PROJECTED
    // per-share figures (never "Data pending").
    await page.getByTestId("tab-income").click();
    await expect(page.getByTestId("panel-income")).toBeVisible();
    await expect(page.getByTestId("income-net-per-share-annual")).not.toContainText("Data pending");
    await expectNoOverflow(page);
    await page
      .screenshot({ path: "screenshots/runs/slice-e-qa/peer-starting-from-estate-tab.png", fullPage: false });

    // Option 1 FX (2026-09-18, 1 EUR = 1.20 USD): Chalet Montana (EUR input)
    // now evaluates the full chain in USD — per-share renders a PROJECTED
    // figure (never "Data pending").
    await page.goto("/property/re-130901");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });
    await page.getByTestId("tab-income").click();
    await expect(page.getByTestId("income-net-per-share-annual")).not.toContainText("Data pending");
    await expectNoOverflow(page);
  });

  test("high-value peer: $60M estate value with the structure's decision facts", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/re-130397");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    await expect(page.getByTestId("hero-estate-value")).toContainText("Estate value: $60M");
    await expect(page.getByTestId("estate-why")).toBeVisible();
    await page.getByTestId("tab-ownership").click();
    await expect(page.getByTestId("ownership-valuation")).toBeVisible();
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/runs/slice-e-qa/peer-high-value-estate-tab.png", fullPage: false });
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

  test("all-24 sweep: structure architecture, honest states, no overflow", async ({ page }) => {
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
      // The §4 Estate architecture renders for every estate…
      await expect(page.getByTestId("estate-why"), `${id} why section`).toBeVisible();
      await expect(page.getByTestId("estate-specs"), `${id} specs`).toBeVisible();
      await expect(page.getByTestId("estate-location"), `${id} location`).toBeVisible();
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
      // …Income carries the four V1 scenario cards (Base expanded)…
      await page.getByTestId("tab-income").click();
      await expect(page.getByTestId("scenario-cards-conservative"), `${id} conservative`).toBeVisible();
      await expect(page.getByTestId("scenario-cards-base"), `${id} base`).toBeVisible();
      await expect(page.getByTestId("scenario-cards-optimistic"), `${id} optimistic`).toBeVisible();
      await expect(page.getByTestId("scenario-cards-average"), `${id} average`).toBeVisible();
      await expect(page.getByTestId("scenario-cards-base"), `${id} base expanded`).toHaveAttribute("aria-expanded", "true");
      // …Ownership carries the decision sections with no simulated holders…
      await page.getByTestId("tab-ownership").click();
      await expect(page.getByTestId("ownership-valuation"), `${id} ownership valuation`).toBeVisible();
      await expect(page.getByTestId("holder-analytics"), `${id} no simulated holders`).toHaveCount(0);
      await expectNoOverflow(page);
    }
  });
});

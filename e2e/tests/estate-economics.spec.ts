// Slice E QA — canonical economics sections on Estate Detail at 480×840.
// Grand 2 BDM (engine-wired) + funding/resale peers (honest unavailable),
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

test.describe("Slice E — canonical economics QA", () => {
  test("Grand 2 BDM: canonical sections render with engine figures", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/prop-marina-vista-4b");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    await expect(page.getByTestId("hero-estate-value")).toContainText("$8,000,000.00");
    await expect(page.getByTestId("estate-economics")).toBeVisible();
    await expect(page.getByTestId("economics-gross")).toContainText("$20,120,625.00");
    await expect(page.getByTestId("estate-costs")).toBeVisible();
    await expect(page.getByTestId("estate-allocation")).toBeVisible();
    await expect(page.getByTestId("estate-investment")).toBeVisible();
    await expect(page.getByTestId("economics-nightly")).toContainText("$67,000.00");
    await expect(page.getByTestId("economics-nightly")).toContainText("$80,000.00");
    await expect(page.getByTestId("economics-adr")).toContainText("$73,500.00");
    // Provenance on demand: no visible wording, tap reveals the explanation.
    await expect(page.getByTestId("economics-gross")).not.toContainText("Calculated");
    await page.getByTestId("economics-gross").getByTestId("provenance-info").click();
    await expect(page.getByTestId("provenance-sheet")).toContainText("Calculated figure");
    await expect(page.getByTestId("provenance-sheet")).toContainText("Not historical performance");
    await page.screenshot({ path: "screenshots/slice-e-qa/provenance-sheet-open.png", fullPage: false });
    // Sheet dismisses via backdrop/Esc like every app sheet — close before continuing.
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("provenance-sheet")).toHaveCount(0);
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/slice-e-qa/grand-estate-tab.png", fullPage: false });

    // Canonical sections: scenario pills switch evaluations; costs expand with
    // all six lines and the green tax honestly pending (guests unconfigured).
    await page.getByTestId("estate-economics").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("scenario-pill-base")).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("costs-toggle").click();
    await expect(page.getByTestId("costs-content")).toBeVisible();
    for (const id of ["tourismTax", "serviceCharge", "greenTax", "agencyRentalOta", "operatorOperating", "repairInsuranceMaintenance"]) {
      await expect(page.getByTestId(`cost-line-${id}`)).toBeVisible();
    }
    await expect(page.getByTestId("cost-line-greenTax")).toContainText("Data pending");
    await expect(page.getByTestId("allocation-owner")).toContainText("Data pending");
    await expect(page.getByTestId("allocation-agency")).toContainText("$3,621,712.50");
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/slice-e-qa/grand-economics-sections.png", fullPage: false });

    // Reconciled About (Details tab): approved research copy + size; mock
    // facts render as labeled pending rows.
    await page.getByTestId("tab-details").click();
    await page.getByTestId("about-more").click();
    await expect(page.getByTestId("about-details")).toContainText("382 m");
    await expect(page.getByTestId("about-year")).toContainText("Data pending");
    await expect(page.getByTestId("about-lease")).toContainText("Data pending");
    await expectNoOverflow(page);
  });

  test("funding peer (RANGE rate): same sections with pending states, no empty shell", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/prop-soho-loft-studio");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    // Rental performance leads with the observed nightly display (range kept).
    await expect(page.getByTestId("rental-story-rent")).toContainText("$52,200");
    // Same section architecture as Grand: economics + costs + allocation render,
    // derived rows pending with the missing input named.
    await expect(page.getByTestId("estate-economics")).toBeVisible();
    await expect(page.getByTestId("economics-pending-note")).toBeVisible();
    // All three bound tabs render and stay selectable without engine inputs.
    await expect(page.getByTestId("scenario-pill-lower")).toBeVisible();
    await expect(page.getByTestId("scenario-pill-base")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("scenario-pill-upper")).toBeVisible();
    await page.getByTestId("scenario-pill-lower").click();
    await expect(page.getByTestId("scenario-pill-lower")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("scenario-pill-base")).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("economics-gross")).toContainText("Data pending");
    await expect(page.getByTestId("estate-costs")).toBeVisible();
    await expect(page.getByTestId("estate-allocation")).toBeVisible();
    await expect(page.getByTestId("allocation-owner")).toContainText("Data pending");
    await expect(page.getByTestId("estate-economics-empty")).toHaveCount(0);
    await expect(page.getByTestId("hero-estate-value")).toContainText("$20,000,000.00");
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
    await page.getByTestId("estate-economics").scrollIntoViewIfNeeded();
    await page.screenshot({ path: "screenshots/slice-e-qa/peer-funding-economics.png", fullPage: false });
    // Peer About carries its own approved research copy (no fixture prose).
    await page.getByTestId("tab-details").click();
    await page.getByTestId("about-more").click();
    await expect(page.getByTestId("about-details")).toContainText("2,787 m");
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/slice-e-qa/peer-funding-estate-tab.png", fullPage: false });
  });

  test("resale peer (DYNAMIC rate): pending economics, investment distinguishes prices", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/prop-miami-beach-condo");
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
    await expect(page.getByTestId("estate-economics")).toBeVisible();
    await expect(page.getByTestId("scenario-pill-lower")).toBeVisible();
    await expect(page.getByTestId("scenario-pill-base")).toBeVisible();
    await expect(page.getByTestId("scenario-pill-upper")).toBeVisible();
    await expect(page.getByTestId("economics-pending-note")).toBeVisible();
    await expect(page.getByTestId("estate-costs")).toBeVisible();
    await expect(page.getByTestId("investment-secondary-price")).toContainText("No single market price");
    await expect(page.getByTestId("investment-lowest-ask")).toBeVisible();
    await expectNoOverflow(page);
    await page.getByTestId("estate-economics").scrollIntoViewIfNeeded();
    await page.screenshot({ path: "screenshots/slice-e-qa/peer-resale-economics.png", fullPage: false });
    await page.screenshot({ path: "screenshots/slice-e-qa/peer-resale-estate-tab.png", fullPage: false });
  });

  test("STARTING_FROM peer: nightly semantics preserved, sections consistent", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/prop-berlin-mitte-apartment");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    await expect(page.getByTestId("rental-story-rent")).toContainText("25,000");
    await expect(page.getByTestId("estate-economics")).toBeVisible();
    await expect(page.getByTestId("scenario-pill-lower")).toBeVisible();
    await expect(page.getByTestId("scenario-pill-base")).toBeVisible();
    await expect(page.getByTestId("scenario-pill-upper")).toBeVisible();
    await expect(page.getByTestId("estate-costs")).toBeVisible();
    await expect(page.getByTestId("estate-allocation")).toBeVisible();
    await expect(page.getByTestId("estate-investment")).toBeVisible();
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/slice-e-qa/peer-starting-from-estate-tab.png", fullPage: false });
  });

  test("high-value peer: $70M estate value with pending derivatives", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/prop-mexico-city-penthouse");
    await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });

    await expect(page.getByTestId("hero-estate-value")).toContainText("$70,000,000.00");
    await expect(page.getByTestId("estate-economics")).toBeVisible();
    await expect(page.getByTestId("economics-pending-note")).toBeVisible();
    await expect(page.getByTestId("estate-investment")).toBeVisible();
    await expectNoOverflow(page);
    await page.screenshot({ path: "screenshots/slice-e-qa/peer-high-value-estate-tab.png", fullPage: false });
  });

  test("Grand 2 BDM: reserve CTA opens the official listing externally", async ({ page }) => {
    await skipOnboarding(page);
    await page.goto("/property/prop-marina-vista-4b");
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
    for (const id of ["prop-marina-vista-4b", "prop-nyc-chelsea-loft"]) {
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

  test("all-24 sweep: identical section architecture, honest states, no overflow", async ({ page }) => {
    test.setTimeout(180_000);
    await skipOnboarding(page);
    const ids = [
      "prop-marina-vista-4b",
      "prop-soho-loft-studio",
      "prop-bayside-marina-penthouse",
      "prop-alfama-terrace-flat",
      "prop-tbilisi-riverhouse-loft",
      "prop-canggu-surf-villa",
      "prop-tokyo-shibuya-studio",
      "prop-brooklyn-brownstone-flat",
      "prop-berlin-mitte-apartment",
      "prop-barcelona-eixample-flat",
      "prop-london-camden-loft",
      "prop-sydney-harbour-apartment",
      "prop-toronto-condo",
      "prop-melbourne-loft",
      "prop-miami-beach-condo",
      "prop-istanbul-bosphorus-flat",
      "prop-mexico-city-penthouse",
      "prop-kyoto-machiya",
      "prop-cape-town-villa",
      "prop-bangkok-sukhumvit-condo",
      "prop-amsterdam-canal-house",
      "prop-buenos-aires-recoleta-flat",
      "prop-seoul-gangnam-studio",
      "prop-nyc-chelsea-loft",
    ];
    expect(ids).toHaveLength(24);
    for (const id of ids) {
      await page.goto(`/property/${id}`);
      await page.waitForSelector('[data-testid="property-detail"]', { timeout: 15_000 });
      // The six canonical sections render for every estate…
      await expect(page.getByTestId("rental-story"), `${id} rental performance`).toBeVisible();
      await expect(page.getByTestId("estate-economics"), `${id} rental economics`).toBeVisible();
      await expect(page.getByTestId("estate-costs"), `${id} cost structure`).toBeVisible();
      await expect(page.getByTestId("estate-allocation"), `${id} profit allocation`).toBeVisible();
      await expect(page.getByTestId("estate-investment"), `${id} investment`).toBeVisible();
      // …exactly three bound tabs (24 × 3 = 72 instances)…
      await expect(page.getByTestId("scenario-pill-lower"), `${id} lower tab`).toBeVisible();
      await expect(page.getByTestId("scenario-pill-base"), `${id} base tab`).toBeVisible();
      await expect(page.getByTestId("scenario-pill-upper"), `${id} upper tab`).toBeVisible();
      // …with approved ESTIMATED provenance on the hero value…
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
      const body = await page.getByTestId("panel-estate").innerText();
      expect(body, `${id} no zero-fabrication`).not.toContain("$0.00");
      expect(body, `${id} no misleading rent label`).not.toContain("Projected annual rent");
      await expectNoOverflow(page);
    }
  });
});

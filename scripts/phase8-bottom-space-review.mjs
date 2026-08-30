/* Bottom-spacing audit for the Property detail page (#08).
 * Opens a primary (funding) and a secondary (resale) property at the Telegram
 * WebView viewport (480x840), walks all 5 tabs, and measures the blank region
 * between the last visible content and the bottom of the scrollable document —
 * and whether anything is hidden behind the sticky CTA.
 * Usage: node scripts/phase8-bottom-space-review.mjs [baseUrl]
 */
import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.join("screenshots", "phase8");
const VIEWPORT = { width: 480, height: 840 };

const TARGETS = [
  { key: "primary", id: "prop-marina-vista-4b" },
  { key: "secondary", id: "prop-bayside-marina-penthouse" },
];

const TABS = ["overview", "performance", "holders", "income", "details"];

async function review(browser, target) {
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();

  // Seed the onboarding gate before any app script runs.
  await page.addInitScript(() => {
    localStorage.setItem(
      "digihouse-settings",
      JSON.stringify({
        state: { onboarded: true, showDemoBadge: true },
        version: 0,
      }),
    );
  });

  const url = `${BASE}/property/${target.id}`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);

  const results = [];

  for (const tab of TABS) {
    const tabLoc = page.locator(`[data-testid="tab-${tab}"]`);
    if (!(await tabLoc.count())) {
      results.push({ tab, error: "tab not found" });
      continue;
    }
    await tabLoc.click();
    await page.waitForTimeout(900); // allow lazy panels to load

    // Scroll to the very bottom of the document.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(500);

    const shot = path.join(OUT, `${target.key}-${tab}-bottom.png`);
    await page.screenshot({ path: shot, fullPage: false });

    const audit = await page.evaluate(() => {
      const doc = document.documentElement;
      const scrollY = window.scrollY;
      const viewportH = window.innerHeight;
      const bottomY = scrollY + viewportH; // viewport bottom in doc coords

      // Last visible element bottom (ignore fixed/overlay elements).
      let lastContentBottom = 0;
      let lastContentTestId = null;
      document.querySelectorAll("main *").forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.position === "fixed" || cs.position === "absolute") return;
        if (cs.display === "none" || cs.visibility === "hidden") return;
        const r = el.getBoundingClientRect();
        if (r.height === 0 && r.width === 0) return;
        // Only leaf-ish elements with actual content or visible borders/bg.
        const hasBg = cs.backgroundColor !== "rgba(0, 0, 0, 0)" || cs.borderBottomWidth !== "0px";
        const hasText = el.children.length === 0 && el.textContent.trim().length > 0;
        const isSvg = el.tagName === "svg" || el.tagName === "IMG" || el.tagName === "CANVAS";
        if (hasText || isSvg || hasBg) {
          const bottom = r.bottom + window.scrollY;
          if (bottom > lastContentBottom) {
            lastContentBottom = bottom;
            lastContentTestId = el.getAttribute("data-testid") || el.tagName;
          }
        }
      });

      // Sticky CTA top edge (if present).
      const cta = document.querySelector('[data-testid="property-sticky-cta"]');
      let ctaTop = null;
      if (cta) {
        const cs = getComputedStyle(cta);
        if (cs.display !== "none") {
          const r = cta.getBoundingClientRect();
          ctaTop = r.top + window.scrollY;
        }
      }

      const docHeight = doc.scrollHeight;
      return {
        scrollY: Math.round(scrollY),
        docHeight,
        lastContentBottom: Math.round(lastContentBottom),
        lastContentTestId,
        ctaTop: ctaTop != null ? Math.round(ctaTop) : null,
        blankAfterContent: Math.round(docHeight - lastContentBottom),
        contentHiddenBehindCta:
          ctaTop != null && lastContentBottom > ctaTop ? Math.round(lastContentBottom - ctaTop) : 0,
      };
    });

    results.push({ tab, shot, ...audit });
  }

  await ctx.close();
  return results;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  for (const target of TARGETS) {
    console.log(`\n===== ${target.key.toUpperCase()} (${target.id}) =====`);
    const results = await review(browser, target);
    for (const r of results) {
      if (r.error) {
        console.log(`${r.tab}: ERROR ${r.error}`);
        continue;
      }
      console.log(
        `${r.tab.padEnd(11)} docH=${r.docHeight} lastContent=${r.lastContentBottom} (${r.lastContentTestId}) ` +
          `blankAfter=${r.blankAfterContent}px ctaTop=${r.ctaTop} hiddenBehindCta=${r.contentHiddenBehindCta}px`,
      );
      console.log(`  shot: ${r.shot}`);
    }
  }
  await browser.close();
})();

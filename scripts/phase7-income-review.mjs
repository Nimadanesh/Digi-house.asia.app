/* Visual review of the Phase 7 Income tab on a primary (funding) and a
 * secondary (resale) property. Launches Chrome via Playwright at the Telegram
 * WebView viewport (480x840), seeds the onboarding gate, opens the property
 * page, clicks the Income tab, screenshots, and audits geometry/styles.
 * The income interaction probe dispatches pointer events on a hit zone because
 * Playwright's synthesized click can be intercepted by the parent SVG.
 * Usage: node scripts/phase7-income-review.mjs [baseUrl]
 */
import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.join("screenshots", "phase7");
const VIEWPORT = { width: 480, height: 840 };

const TARGETS = [
  { key: "primary", id: "prop-marina-vista-4b" },
  { key: "secondary", id: "prop-bayside-marina-penthouse" },
];

async function review(browser, target) {
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();

  // Seed the onboarding gate before any app script runs (mock mode keeps
  // ProfileGate passive because MOCK_USER.onboarded is false).
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

  // Click the Income tab.
  const tab = page.locator('[data-testid="tab-income"]');
  if (!(await tab.count())) {
    console.error(`${target.key}: tab-income NOT FOUND — url=${page.url()}`);
    await page.screenshot({ path: path.join(OUT, `${target.key}-error.png`), fullPage: true });
    await ctx.close();
    return null;
  }
  await tab.click();
  await page.waitForTimeout(800);

  // Full-page screenshot.
  const shot = path.join(OUT, `${target.key}-income-full.png`);
  await page.screenshot({ path: shot, fullPage: true });

  // Geometry / style audit.
  const audit = await page.evaluate(() => {
    const out = { scrollWidth: document.documentElement.scrollWidth, blocks: [], svgs: [], ratioValues: [] };

    const root = document.querySelector('[data-testid="income-analytics"]');
    out.incomeAnalyticsPresent = !!root;

    document.querySelectorAll('[data-testid="income-analytics"] svg[data-testid]').forEach((svg) => {
      const r = svg.getBoundingClientRect();
      out.svgs.push({
        testid: svg.getAttribute("data-testid"),
        w: Math.round(r.width),
        h: Math.round(r.height),
        path: svg.querySelectorAll("path").length,
        rect: svg.querySelectorAll("rect").length,
        text: svg.querySelectorAll("text").length,
      });
    });

    document.querySelectorAll('[data-testid="income-analytics"] h3').forEach((h) => {
      const block = h.closest("div[class*='p-4'], div[class*='rounded']");
      const r = (block || h).getBoundingClientRect();
      const cs = block ? getComputedStyle(block) : null;
      out.blocks.push({
        title: h.textContent.trim().slice(0, 40),
        w: Math.round(r.width),
        radius: cs ? cs.borderRadius : null,
        shadow: cs ? cs.boxShadow.slice(0, 40) : null,
      });
    });

    out.payoutRows = document.querySelectorAll('[data-testid^="payout-row-"]').length;

    const ratioCells = document.querySelectorAll('[data-testid="income-ratios"] .tnum');
    out.ratioValues = [...ratioCells].map((el) => el.textContent.trim()).slice(0, 4);

    out.fontFamily = getComputedStyle(document.body).fontFamily.slice(0, 60);
    return out;
  });

  // Interaction check: dispatch pointer events on a hit zone (Playwright's
  // synthesized click can be intercepted by the parent SVG — dispatch through
  // the element instead, matching the HitZones onPointerDown handler).
  const hit = page.locator('[data-testid="chart-hit-2"]').first();
  let tooltip = null;
  if (await hit.count()) {
    await hit.evaluate((el) => {
      el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      el.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    });
    await page.waitForTimeout(300);
    tooltip = await page.locator('[data-testid="income-tooltip"]').textContent().catch(() => null);
  }

  await ctx.close();
  return { shot, audit, tooltip };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  for (const target of TARGETS) {
    const result = await review(browser, target);
    if (!result) continue;
    console.log(`\n===== ${target.key.toUpperCase()} (${target.id}) =====`);
    console.log(JSON.stringify({ ...result.audit, incomeTooltip: result.tooltip }, null, 2));
    console.log(`saved ${result.shot}`);
  }
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

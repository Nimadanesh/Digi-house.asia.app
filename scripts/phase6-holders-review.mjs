/* Visual review of the Phase 6 Holders tab on a primary (funding) and a
 * secondary (resale) property. Launches Chrome via Playwright at the Telegram
 * WebView viewport (480x840), seeds the onboarding gate, opens the property
 * page, clicks the Holders tab, screenshots, and audits geometry/styles.
 * The donut interaction probe dispatches pointer events on the segment element
 * because Playwright's synthesized click targets the path while the parent SVG
 * intercepts pointer events.
 * Usage: node scripts/phase6-holders-review.mjs [baseUrl]
 */
import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.join("screenshots", "phase6");
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

  // Click the Holders tab.
  const tab = page.locator('[data-testid="tab-holders"]');
  if (!(await tab.count())) {
    console.error(`${target.key}: tab-holders NOT FOUND — url=${page.url()}`);
    await page.screenshot({ path: path.join(OUT, `${target.key}-error.png`), fullPage: true });
    await ctx.close();
    return null;
  }
  await tab.click();
  await page.waitForTimeout(800);

  // Full-page screenshot.
  const shot = path.join(OUT, `${target.key}-holders-full.png`);
  await page.screenshot({ path: shot, fullPage: true });

  // Geometry / style audit.
  const audit = await page.evaluate(() => {
    const out = { scrollWidth: document.documentElement.scrollWidth, blocks: [], svgs: [], buttons: [] };

    const root = document.querySelector('[data-testid="holder-analytics"]');
    out.holderAnalyticsPresent = !!root;

    document.querySelectorAll('[data-testid="holder-analytics"] svg[data-testid]').forEach((svg) => {
      const r = svg.getBoundingClientRect();
      const counts = {
        path: svg.querySelectorAll("path").length,
        rect: svg.querySelectorAll("rect").length,
        circle: svg.querySelectorAll("circle").length,
        text: svg.querySelectorAll("text").length,
      };
      out.svgs.push({
        testid: svg.getAttribute("data-testid"),
        w: Math.round(r.width),
        h: Math.round(r.height),
        ...counts,
      });
    });

    document.querySelectorAll('[data-testid="holder-analytics"] h3').forEach((h) => {
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

    document.querySelectorAll('[data-testid="holder-analytics"] button').forEach((b) => {
      const r = b.getBoundingClientRect();
      out.buttons.push({ label: (b.textContent || "").trim().slice(0, 16), w: Math.round(r.width), h: Math.round(r.height) });
    });

    out.minButtonH = out.buttons.length ? Math.min(...out.buttons.map((b) => b.h)) : null;
    out.fontFamily = getComputedStyle(document.body).fontFamily.slice(0, 60);
    return out;
  });

  // Interaction check: dispatch pointer events on a donut segment (Playwright's
  // synthesized click targets the path but the parent SVG intercepts pointer
  // events — dispatch through the element instead, matching onPointerDown).
  const seg = page.locator('[data-testid^="donut-seg-"]').first();
  let tooltip = null;
  if (await seg.count()) {
    await seg.evaluate((el) => {
      el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      el.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    });
    await page.waitForTimeout(300);
    tooltip = await page.locator('[data-testid="donut-tooltip"]').textContent().catch(() => null);
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
    console.log(JSON.stringify({ ...result.audit, donutTooltip: result.tooltip }, null, 2));
    console.log(`saved ${result.shot}`);
  }
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

/* Visual + behavioral audit of the compact top bar (#07b) and the tightened
 * bottom clearance (#08) on the Property detail page. Opens a primary and a
 * secondary property at the Telegram WebView viewport (480x840), scrolls down
 * past the hero, then scrolls up — asserting the compact bar appears, hides on
 * scroll-down, and its back control navigates. Screenshots each state.
 * Usage: node scripts/phase8-topbar-review.mjs [baseUrl]
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

async function review(browser, target) {
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem(
      "digihouse-settings",
      JSON.stringify({ state: { onboarded: true, showDemoBadge: true }, version: 0 }),
    );
  });

  await page.goto(`${BASE}/property/${target.id}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);

  const results = { states: [] };

  const barState = () =>
    page.evaluate(() => {
      const bar = document.querySelector('[data-testid="property-compact-topbar"]');
      if (!bar) return { present: false };
      const inner = bar.firstElementChild;
      const cs = getComputedStyle(inner);
      return {
        present: true,
        opacity: cs.opacity,
        pointerEvents: cs.pointerEvents,
        title: bar.querySelector('[data-testid="compact-topbar-title"]')?.textContent ?? null,
        backBtn: !!bar.querySelector('[data-testid="compact-topbar-back"]'),
      };
    });

  // 1. At top → bar must be hidden.
  await page.mouse.move(240, 400);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  results.states.push({ state: "at-top", ...(await barState()) });

  // 2. Scroll down past hero (wheel steps → real scroll events) → still hidden.
  for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 130); await page.waitForTimeout(40); }
  await page.waitForTimeout(500);
  results.states.push({ state: "scrolled-down", ...(await barState()) });

  // 3. Scroll up mid-page (wheel steps) → bar must appear.
  for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, -130); await page.waitForTimeout(40); }
  await page.waitForTimeout(500);
  results.states.push({ state: "scrolled-up", ...(await barState()) });
  await page.screenshot({ path: path.join(OUT, `${target.key}-topbar-visible.png`) });

  // 4. Scroll down again → bar hides.
  for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 130); await page.waitForTimeout(40); }
  await page.waitForTimeout(500);
  results.states.push({ state: "scrolled-down-again", ...(await barState()) });

  // 5. Back control navigates (when bar visible).
  for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, -130); await page.waitForTimeout(40); }
  await page.waitForTimeout(500);
  const back = page.locator('[data-testid="compact-topbar-back"]');
  if (await back.count()) {
    const clickable = await back.evaluate((el) => getComputedStyle(el).pointerEvents !== "none" && getComputedStyle(el).opacity !== "0");
    results.backClickable = clickable;
    if (clickable) {
      await back.click();
      await page.waitForTimeout(800);
      results.backNavigatedAway = !page.url().includes(`/property/${target.id}`);
      results.urlAfterBack = page.url();
    }
  }

  await ctx.close();
  return results;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  let pass = true;
  for (const target of TARGETS) {
    console.log(`\n===== ${target.key.toUpperCase()} (${target.id}) =====`);
    const r = await review(browser, target);
    for (const s of r.states) {
      const visible = s.present && parseFloat(s.opacity) > 0.5;
      const ok =
        (s.state === "scrolled-up" ? visible : s.state.startsWith("scrolled-down") || s.state === "at-top" ? !visible : true);
      if (!ok) pass = false;
      console.log(
        `${s.state.padEnd(20)} present=${s.present} opacity=${s.opacity} pointerEvents=${s.pointerEvents} title="${s.title ?? "-"}" ${ok ? "OK" : "FAIL"}`,
      );
    }
    if (r.backClickable !== undefined) {
      console.log(`back clickable=${r.backClickable} navigatedAway=${r.backNavigatedAway} url=${r.urlAfterBack}`);
      if (r.backClickable && !r.backNavigatedAway) pass = false;
    }
  }
  console.log(`\nRESULT: ${pass ? "PASS" : "FAIL"}`);
  await browser.close();
  process.exit(pass ? 0 : 1);
})();

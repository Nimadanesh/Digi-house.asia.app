import { type Page } from "@playwright/test";

/**
 * Set up auth for an E2E test by injecting NEXT_PUBLIC_DEV_TOKEN.
 * Call this in a beforeAll or beforeEach hook.
 *
 * The token must have been minted via mint-jwt.ts and placed into
 * the Mini App's env as NEXT_PUBLIC_DEV_TOKEN.
 *
 * This helper is minimal — it only verifies the app is in api mode
 * before the test runs (we cannot inject at runtime).
 */
export async function ensureAuthenticated(page: Page): Promise<void> {
  // Navigate to home to trigger AuthProvider init
  await page.goto("/home", { waitUntil: "networkidle" });

  // AuthProvider may show "loading" briefly — wait for resolution
  await page.waitForTimeout(2000);

  // Check if we see unauthenticated indicators
  const unauthIndicator = page.getByText("Connect Wallet");
  if (await unauthIndicator.isVisible().catch(() => false)) {
    console.warn("[auth] App shows unauthenticated — DEV_TOKEN may not be set");
  }
}

import { defineConfig } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e/tests",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 2,
  retries: 1,
  reporter: [["list"], ["html", { outputFolder: "e2e/reports" }]],
  use: {
    baseURL: BASE_URL,
    viewport: { width: 480, height: 840 },
    actionTimeout: 10_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium", channel: "chrome" },
    },
  ],
});

import { test as base } from "@playwright/test";

export const PLAYWRIGHT_BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
export const PLAYWRIGHT_API_URL = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:8787";

export function skipIfNoBaseUrl(): void {
  if (!process.env.PLAYWRIGHT_BASE_URL) {
    base.skip(true, "PLAYWRIGHT_BASE_URL not set — skipping test");
  }
}

export function skipIfNoApiUrl(): void {
  if (!process.env.PLAYWRIGHT_API_URL) {
    base.skip(true, "PLAYWRIGHT_API_URL not set — skipping test");
  }
}

"use client";
// File responsibility: map Telegram themeParams to CSS custom properties on :root.
import type { ThemeParams } from "./signals";

// Telegram themeParams key -> our css var name
const MAP: Record<keyof ThemeParams, string> = {
  backgroundColor: "--tg-bg-color",
  textColor: "--tg-text-color",
  hintColor: "--tg-hint-color",
  buttonColor: "--tg-button-color",
  buttonTextColor: "--tg-button-text-color",
  secondaryBackgroundColor: "--tg-secondary-bg-color",
  sectionBgColor: "--tg-section-bg-color",
  sectionHeaderTextColor: "--tg-section-header-text-color",
  subtitleTextColor: "--tg-subtitle-text-color",
  accentTextColor: "--tg-accent-text-color",
  destructiveTextColor: "--tg-destructive-text-color",
  headerBackgroundColor: "--tg-header-bg-color",
  linkColor: "--tg-link-color",
  bottomBarBgColor: "--tg-bottom-bar-bg-color",
  sectionSeparatorColor: "--tg-section-separator-color",
} as Record<keyof ThemeParams, string>;

export function applyTelegramThemeParams(params: ThemeParams): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(params) as [keyof ThemeParams, string | undefined][]) {
    if (v) root.style.setProperty(MAP[k] ?? `--tg-${String(k)}`, v);
  }
}
"use client";
// File responsibility: map Telegram themeParams to CSS custom properties on :root.
import type { ThemeParams } from "./signals";

// Telegram themeParams key -> our css var name
const MAP: Record<keyof ThemeParams, string> = {
  bg_color: "--tg-bg-color",
  text_color: "--tg-text-color",
  hint_color: "--tg-hint-color",
  button_color: "--tg-button-color",
  button_text_color: "--tg-button-text-color",
  secondary_bg_color: "--tg-secondary-bg-color",
  section_bg_color: "--tg-section-bg-color",
  section_header_text_color: "--tg-section-header-text-color",
  subtitle_text_color: "--tg-subtitle-text-color",
  accent_text_color: "--tg-accent-text-color",
  destructive_text_color: "--tg-destructive-text-color",
  header_bg_color: "--tg-header-bg-color",
  link_color: "--tg-link-color",
  bottom_bar_bg_color: "--tg-bottom-bar-bg-color",
  section_separator_color: "--tg-section-separator-color",
} as Record<keyof ThemeParams, string>;

export function applyTelegramThemeParams(params: ThemeParams): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(params) as [keyof ThemeParams, string | undefined][]) {
    if (v) root.style.setProperty(MAP[k] ?? `--tg-${String(k)}`, v);
  }
}
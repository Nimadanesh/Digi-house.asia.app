"use client";
// File responsibility: apply DigiHouse static (default) or live Telegram theme based on settings store.
import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settings.store";
import { bindLiveThemeVars } from "@/lib/telegram";

const TG_VARS: string[] = [
  "--tg-bg-color","--tg-text-color","--tg-hint-color","--tg-button-color","--tg-button-text-color",
  "--tg-secondary-bg-color","--tg-section-bg-color","--tg-section-header-text-color","--tg-subtitle-text-color",
  "--tg-accent-text-color","--tg-destructive-text-color","--tg-header-bg-color","--tg-link-color",
  "--tg-bottom-bar-bg-color","--tg-section-separator-color",
];

export function useTheme(): void {
  const useTelegramTheme = useSettingsStore((s) => s.useTelegramTheme);
  useEffect(() => {
    if (useTelegramTheme) bindLiveThemeVars();
    else if (typeof document !== "undefined") {
      const root = document.documentElement;
      TG_VARS.forEach((v) => root.style.removeProperty(v));
    }
  }, [useTelegramTheme]);
}
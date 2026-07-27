// File responsibility: map Telegram / browser language codes → AppLocale.
import {
  DEFAULT_LOCALE,
  isAppLocale,
  type AppLocale,
} from "@/i18n/config";

/**
 * Normalize Telegram `language_code` (e.g. "fa", "fa-IR", "en-US") to a supported locale.
 * Falls back to English when unknown.
 */
export function detectLocaleFromCode(code: string | null | undefined): AppLocale {
  if (!code) return DEFAULT_LOCALE;
  const raw = code.trim().toLowerCase().replace("_", "-");
  if (!raw) return DEFAULT_LOCALE;

  const primary = raw.split("-")[0] ?? raw;
  if (isAppLocale(primary)) return primary;

  // Occasional Telegram variants
  if (primary === "fa" || raw.startsWith("fa")) return "fa";
  if (primary === "ar" || raw.startsWith("ar")) return "ar";
  if (primary === "ru" || raw.startsWith("ru")) return "ru";
  if (primary === "de" || raw.startsWith("de")) return "de";
  if (primary === "tr" || raw.startsWith("tr")) return "tr";
  if (primary === "en" || raw.startsWith("en")) return "en";

  return DEFAULT_LOCALE;
}

/** Browser navigator language (dev / outside TMA). */
export function detectBrowserLocale(): AppLocale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  return detectLocaleFromCode(navigator.language);
}

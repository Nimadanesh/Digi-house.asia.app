// File responsibility: map Telegram / browser language codes → AppLocale.
import {
  DEFAULT_LOCALE,
  isAppLocale,
  type AppLocale,
} from "@/i18n/config";

/**
 * Normalize Telegram `language_code` (e.g. "fa", "fa-IR", "zh-hans", "pt-BR") to a supported locale.
 * Falls back to English when unknown.
 */
export function detectLocaleFromCode(code: string | null | undefined): AppLocale {
  if (!code) return DEFAULT_LOCALE;
  const raw = code.trim().toLowerCase().replace(/_/g, "-");
  if (!raw) return DEFAULT_LOCALE;

  const primary = raw.split("-")[0] ?? raw;
  if (isAppLocale(primary)) return primary;

  // Chinese variants (Telegram often sends zh-hans / zh-cn)
  if (primary === "zh" || raw.startsWith("zh")) return "zh";
  // Portuguese (pt-BR, pt-PT)
  if (primary === "pt") return "pt";
  // Spanish
  if (primary === "es") return "es";
  // French
  if (primary === "fr") return "fr";
  // Hindi
  if (primary === "hi") return "hi";
  // Indonesian (id) — also map legacy "in"
  if (primary === "id" || primary === "in") return "id";

  if (primary === "fa") return "fa";
  if (primary === "ar") return "ar";
  if (primary === "ru") return "ru";
  if (primary === "de") return "de";
  if (primary === "tr") return "tr";
  if (primary === "en") return "en";

  return DEFAULT_LOCALE;
}

/** Browser navigator language (dev / outside TMA). */
export function detectBrowserLocale(): AppLocale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  return detectLocaleFromCode(navigator.language);
}

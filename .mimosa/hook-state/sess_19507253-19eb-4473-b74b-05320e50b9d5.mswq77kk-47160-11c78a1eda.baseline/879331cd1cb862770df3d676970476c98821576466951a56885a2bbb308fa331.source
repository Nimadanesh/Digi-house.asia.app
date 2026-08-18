// File responsibility: supported locales, RTL set, and display metadata for DigiHouse i18n.
// LOCALES order = Settings language picker order (do not sort alphabetically).
export const LOCALES = [
  "en", // 1. English
  "ar", // 2. Arabic
  "ru", // 3. Russian
  "de", // 4. German
  "tr", // 5. Turkish
  "fr", // 6. French
  "es", // 7. Spanish
  "pt", // 8. Portuguese
  "zh", // 9. Chinese (Simplified)
  "hi", // 10. Hindi
  "fa", // 11. Persian (Farsi)
  "id", // 12. Indonesian
] as const;

export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

/** Locales that require right-to-left document direction. */
export const RTL_LOCALES: readonly AppLocale[] = ["ar", "fa"] as const;

export function isAppLocale(value: string): value is AppLocale {
  return (LOCALES as readonly string[]).includes(value);
}

export function isRtlLocale(locale: AppLocale): boolean {
  return (RTL_LOCALES as readonly string[]).includes(locale);
}

/** Native + English labels for the language picker. */
export const LOCALE_META: Record<
  AppLocale,
  { nativeLabel: string; englishLabel: string }
> = {
  en: { nativeLabel: "English", englishLabel: "English" },
  ar: { nativeLabel: "العربية", englishLabel: "Arabic" },
  ru: { nativeLabel: "Русский", englishLabel: "Russian" },
  de: { nativeLabel: "Deutsch", englishLabel: "German" },
  tr: { nativeLabel: "Türkçe", englishLabel: "Turkish" },
  fr: { nativeLabel: "Français", englishLabel: "French" },
  es: { nativeLabel: "Español", englishLabel: "Spanish" },
  pt: { nativeLabel: "Português", englishLabel: "Portuguese" },
  zh: { nativeLabel: "简体中文", englishLabel: "Chinese" },
  hi: { nativeLabel: "हिन्दी", englishLabel: "Hindi" },
  fa: { nativeLabel: "فارسی", englishLabel: "Persian" },
  id: { nativeLabel: "Bahasa Indonesia", englishLabel: "Indonesian" },
};

/** Display label for picker rows (native · English when different). */
export function localePickerLabel(code: AppLocale): string {
  const { nativeLabel, englishLabel } = LOCALE_META[code];
  if (nativeLabel === englishLabel) return nativeLabel;
  return `${nativeLabel} (${englishLabel})`;
}

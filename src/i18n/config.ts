// File responsibility: supported locales, RTL set, and display metadata for DigiHouse i18n.
export const LOCALES = ["en", "fa", "ar", "ru", "de", "tr"] as const;

export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

/** Locales that require right-to-left document direction. */
export const RTL_LOCALES: readonly AppLocale[] = ["fa", "ar"] as const;

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
  fa: { nativeLabel: "فارسی", englishLabel: "Persian" },
  ar: { nativeLabel: "العربية", englishLabel: "Arabic" },
  ru: { nativeLabel: "Русский", englishLabel: "Russian" },
  de: { nativeLabel: "Deutsch", englishLabel: "German" },
  tr: { nativeLabel: "Türkçe", englishLabel: "Turkish" },
};

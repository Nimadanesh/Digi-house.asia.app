// File responsibility: lazy-load message catalogs per locale (client-safe dynamic import).
import type { AppLocale } from "@/i18n/config";

export type Messages = typeof import("../../messages/en.json");

const loaders: Record<AppLocale, () => Promise<Messages>> = {
  en: () => import("../../messages/en.json").then((m) => m.default),
  fa: () => import("../../messages/fa.json").then((m) => m.default),
  ar: () => import("../../messages/ar.json").then((m) => m.default),
  ru: () => import("../../messages/ru.json").then((m) => m.default),
  de: () => import("../../messages/de.json").then((m) => m.default),
  tr: () => import("../../messages/tr.json").then((m) => m.default),
};

export async function getMessages(locale: AppLocale): Promise<Messages> {
  try {
    return await loaders[locale]();
  } catch {
    return loaders.en();
  }
}

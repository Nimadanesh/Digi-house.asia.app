"use client";
// File responsibility: resolve locale (persist → Telegram → browser), load messages, set dir/lang.
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NextIntlClientProvider } from "next-intl";
import { useSignal } from "@telegram-apps/sdk-react";
import { initDataUser } from "@/lib/telegram/signals";
import { useSettingsStore } from "@/stores/settings.store";
import {
  DEFAULT_LOCALE,
  isRtlLocale,
  type AppLocale,
} from "@/i18n/config";
import { detectLocaleFromCode, detectBrowserLocale } from "@/i18n/detect-locale";
import { getMessages, type Messages } from "@/i18n/get-messages";
import enMessages from "../../../messages/en.json";

function applyDocumentLocale(locale: AppLocale) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.lang = locale;
  root.dir = isRtlLocale(locale) ? "rtl" : "ltr";
  root.dataset.locale = locale;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const preferred = useSettingsStore((s) => s.locale);
  const hydrated = useSettingsStore((s) => s._hasHydrated);
  const tgUser = useSignal(initDataUser);

  const resolvedLocale = useMemo((): AppLocale => {
    if (preferred) return preferred;
    const fromTg = detectLocaleFromCode(tgUser?.language_code);
    if (tgUser?.language_code) return fromTg;
    return detectBrowserLocale();
  }, [preferred, tgUser?.language_code]);

  const [messages, setMessages] = useState<Messages>(enMessages as Messages);
  const [activeLocale, setActiveLocale] = useState<AppLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    let cancelled = false;
    void getMessages(resolvedLocale).then((m) => {
      if (cancelled) return;
      setMessages(m);
      setActiveLocale(resolvedLocale);
      applyDocumentLocale(resolvedLocale);
    });
    return () => {
      cancelled = true;
    };
  }, [resolvedLocale]);

  // Apply dir as soon as hydration + preference are known (before async messages).
  useEffect(() => {
    if (!hydrated && preferred === null) return;
    applyDocumentLocale(resolvedLocale);
  }, [hydrated, preferred, resolvedLocale]);

  return (
    <NextIntlClientProvider
      locale={activeLocale}
      messages={messages}
      timeZone="UTC"
      onError={() => {
        /* missing keys fall back silently in MVP */
      }}
      getMessageFallback={({ key }) => key}
    >
      {children}
    </NextIntlClientProvider>
  );
}

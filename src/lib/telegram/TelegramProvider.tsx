"use client";
// File responsibility: initialize the Telegram SDK, expand viewport, set header/bg color, signal ready.
// React components consume `useTelegram()` — never this provider directly for state.
//
// Dev/outside-Telegram safety: `init()` calls `retrieveLaunchParams()` internally, which throws
// `LaunchParamsRetrieveError` when the page is not running inside the Telegram WebApp iframe
// (localhost, any regular browser tab). We guard with `isTMA()` first, and when not in Telegram we
// call `mockTelegramEnv()` to install synthetic launch params so the SDK's signal hooks return sane
// defaults and downstream calls (miniApp.ready, viewport.mount, etc.) no-op instead of throwing.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSignal } from "@telegram-apps/sdk-react";
import {
  init,
  miniApp,
  viewport,
  closingBehavior,
  backButton,
  mainButton,
  themeParams,
  isTMA,
  mockTelegramEnv,
} from "./signals";
import { applyTelegramThemeParams } from "./theme-mapper";

interface TelegramContextValue { ready: boolean; isDark: boolean }
const TelegramContext = createContext<TelegramContextValue>({ ready: false, isDark: true });

// Minimal synthetic launch params used ONLY when running outside Telegram (localhost dev, Vercel
// preview outside the Bot iframe). Matches the SDK's expected query-string schema so signal hooks
// (themeParams.isDark, viewport, etc.) return deterministic defaults during development.
const MOCK_LAUNCH_PARAMS =
  "tgWebAppPlatform=unknown&tgWebAppVersion=0.0"
  + "&tgWebAppThemeParams=" + encodeURIComponent(
    '{"bg_color":"#17212b","text_color":"#ffffff","hint_color":"#708499","button_color":"#3390ec","button_text_color":"#ffffff","secondary_bg_color":"#232e3c"}',
  )
  + "&tgWebAppData=" + encodeURIComponent("query_id=&user=%7B%22id%22%3A0%7D&auth_date=0&hash=mock");

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const isDark = useSignal(themeParams.isDark);

  useEffect(() => {
    // isTMA() is safe to call anywhere; returns false outside Telegram without throwing.
    const inTelegram = isTMA();
    if (!inTelegram) {
      // Install synthetic launch params so init() and all signal hooks work in dev.
      try { mockTelegramEnv({ launchParams: MOCK_LAUNCH_PARAMS }); } catch { /* already mocked */ }
    }
    let cleanup: (() => void) | undefined;
    try {
      // With mocked launch params in dev, init no longer throws LaunchParamsRetrieveError.
      cleanup = init({ acceptCustomStyles: true });
    } catch {
      // Defensive: if init still fails (e.g. mocked env was already set up), keep going so the
      // app renders — signals fall back to defaults. The UI is built to tolerate missing TG.
    }

    try { miniApp.ready(); } catch { /* not in Telegram yet */ }
    try { void miniApp.setHeaderColor("#17212b"); } catch { /* ignore */ }
    try { void miniApp.setBackgroundColor("#17212b"); } catch { /* ignore */ }
    try { void viewport.mount(); } catch { /* ignore */ }
    try { void viewport.expand(); } catch { /* ignore */ }
    try { closingBehavior.mount(); } catch { /* ignore */ }
    try { backButton.mount(); mainButton.mount(); } catch { /* ignore */ }

    // Defer setState to a microtask so it is NOT synchronous in the effect body
    // (satisfies react-hooks/set-state-in-effect). Reactive results unchanged:
    // `ready` flips true on the next microtask after init completes.
    queueMicrotask(() => setReady(true));
    return () => { try { cleanup?.(); } catch { /* ignore */ } };
  }, []);

  const value = useMemo<TelegramContextValue>(() => ({ ready, isDark }), [ready, isDark]);
  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
}

// Live theme binding helper used by useTheme (when settings.useTelegramTheme === true).
export function bindLiveThemeVars(): void {
  try { themeParams.bindCssVars(); } catch { /* ignore */ }
  applyTelegramThemeParams(themeParams.state() as Parameters<typeof applyTelegramThemeParams>[0]);
}

export function useTelegramReady(): boolean {
  return useContext(TelegramContext).ready;
}
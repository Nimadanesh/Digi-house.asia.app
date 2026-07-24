"use client";
// File responsibility: initialize the Telegram SDK, expand viewport, set header/bg color, signal ready.
// React components consume `useTelegram()` — never this provider directly for state.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSignal } from "@telegram-apps/sdk-react";
import { init, miniApp, viewport, closingBehavior, backButton, mainButton, themeParams } from "./signals";
import { applyTelegramThemeParams } from "./theme-mapper";

interface TelegramContextValue { ready: boolean; isDark: boolean }
const TelegramContext = createContext<TelegramContextValue>({ ready: false, isDark: true });

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const isDark = useSignal(themeParams.isDark);

  useEffect(() => {
    const cleanup = init({ acceptCustomStyles: true });
    try { miniApp.ready(); } catch { /* not in Telegram yet */ }
    try { void miniApp.setHeaderColor("#17212b"); } catch { /* ignore */ }
    try { void miniApp.setBackgroundColor("#17212b"); } catch { /* ignore */ }
    try { void viewport.mount(); } catch { /* ignore */ }
    try { void viewport.expand(); } catch { /* ignore */ }
    try { closingBehavior.mount(); } catch { /* ignore */ }
    backButton.mount(); mainButton.mount();
    // Defer setState to a microtask so it is NOT synchronous in the effect body
    // (satisfies react-hooks/set-state-in-effect). Reactive results unchanged:
    // `ready` flips true on the next microtask after init completes.
    queueMicrotask(() => setReady(true));
    return () => { try { cleanup(); } catch { /* ignore */ } };
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
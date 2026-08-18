"use client";
// File responsibility: the ONLY Telegram SDK surface components/hooks may call.
// Chrome (Back/Main) + haptics are stable. Avoid subscribing to high-frequency viewport
// signals here — that re-rendered every interactive component on every tick.
import { useCallback, useMemo } from "react";
import { useSignal } from "@telegram-apps/sdk-react";
import { themeParams, type SafeAreaInsets } from "@/lib/telegram/signals";
import { haptics } from "@/lib/telegram/haptics";
import { safeBackButton, safeMainButton, type MainButtonParams } from "@/lib/telegram/chrome";
import { useTelegramReady } from "@/lib/telegram/TelegramProvider";

const STATIC_VIEWPORT = {
  width: 390,
  height: 844,
  stableHeight: 844,
  isExpanded: true,
} as const;

const STATIC_INSETS: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };

export interface TelegramSurface {
  ready: boolean;
  isDark: boolean;
  viewport: { width: number; height: number; stableHeight: number; isExpanded: boolean };
  safeAreaInsets: SafeAreaInsets;
  backButton: { show: () => void; hide: () => void; onClick: (fn: () => void) => () => void };
  mainButton: {
    setParams: (p: MainButtonParams) => void;
    hide: () => void;
    onClick: (fn: () => void) => () => void;
  };
  haptics: typeof haptics;
  themeParams: ReturnType<typeof themeParams.state> | Record<string, never>;
}

export function useTelegram(): TelegramSurface {
  const ready = useTelegramReady();
  // isDark rarely changes — safe to subscribe once.
  const isDark = useSignal(themeParams.isDark);

  const onClickBack = useCallback((fn: () => void) => safeBackButton.onClick(fn), []);
  const onClickMain = useCallback((fn: () => void) => safeMainButton.onClick(fn), []);

  const backButton = useMemo(
    () => ({
      show: safeBackButton.show,
      hide: safeBackButton.hide,
      onClick: onClickBack,
    }),
    [onClickBack],
  );

  const mainButton = useMemo(
    () => ({
      setParams: safeMainButton.setParams,
      hide: safeMainButton.hide,
      onClick: onClickMain,
    }),
    [onClickMain],
  );

  return useMemo(
    () => ({
      ready,
      isDark,
      viewport: STATIC_VIEWPORT,
      safeAreaInsets: STATIC_INSETS,
      backButton,
      mainButton,
      haptics,
      themeParams: {},
    }),
    [ready, isDark, backButton, mainButton],
  );
}

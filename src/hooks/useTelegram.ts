"use client";
// File responsibility: the ONLY Telegram SDK surface components/hooks may call.
// Returns reactive viewport + safe-area insets (via useSignal), BackButton/MainButton API,
// haptics, and theme params. Components never import @telegram-apps/* directly.
import { useCallback } from "react";
import { useSignal } from "@telegram-apps/sdk-react";
import { viewport, backButton, mainButton, themeParams, type SafeAreaInsets } from "@/lib/telegram/signals";
import { haptics } from "@/lib/telegram/haptics";
import { useTelegramReady } from "@/lib/telegram/TelegramProvider";

export interface TelegramSurface {
  ready: boolean;
  isDark: boolean;
  viewport: { width: number; height: number; stableHeight: number; isExpanded: boolean };
  safeAreaInsets: SafeAreaInsets;
  backButton: { show: () => void; hide: () => void; onClick: (fn: () => void) => () => void };
  mainButton: { setParams: (p: { text?: string; color?: string; textColor?: string; isEnabled?: boolean }) => void; hide: () => void; onClick: (fn: () => void) => () => void };
  haptics: typeof haptics;
  themeParams: ReturnType<typeof themeParams.state>;
}

export function useTelegram(): TelegramSurface {
  const ready = useTelegramReady();
  const isDark = useSignal(themeParams.isDark);
  const width = useSignal(viewport.width);
  const height = useSignal(viewport.height);
  const stableHeight = useSignal(viewport.stableHeight);
  const isExpanded = useSignal(viewport.isExpanded);
  const safeAreaInsets = useSignal(viewport.safeAreaInsets);
  const themeParamsValue = useSignal(themeParams.state);

  const onClickBack = useCallback((fn: () => void) => {
    backButton.onClick(fn);
    return () => backButton.offClick(fn);
  }, []);
  const onClickMain = useCallback((fn: () => void) => {
    mainButton.onClick(fn);
    return () => mainButton.offClick(fn);
  }, []);
  const hideMain = useCallback(() => {
    try { mainButton.setParams({ isVisible: false } as never); } catch { /* ignore */ }
  }, []);

  return {
    ready, isDark,
    viewport: { width, height, stableHeight, isExpanded },
    safeAreaInsets,
    backButton: { show: backButton.show, hide: backButton.hide, onClick: onClickBack },
    mainButton: { setParams: (p) => mainButton.setParams(p as never), hide: hideMain, onClick: onClickMain },
    haptics,
    themeParams: themeParamsValue,
  };
}
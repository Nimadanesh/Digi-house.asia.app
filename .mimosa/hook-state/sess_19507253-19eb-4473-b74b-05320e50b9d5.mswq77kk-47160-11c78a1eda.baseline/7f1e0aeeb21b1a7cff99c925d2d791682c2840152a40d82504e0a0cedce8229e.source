"use client";
// File responsibility: lifecycle helper for Telegram BackButton visibility + click.
// Hide on first step of multi-step UIs; show + pop step otherwise. Safe outside Mini Apps.
import { useEffect } from "react";
import { useTelegram } from "@/hooks/useTelegram";

/**
 * Syncs native BackButton with a multi-step index.
 * - index <= 0 → hide (dev: no-op outside TMA)
 * - index > 0 → show and call `onBack` on press
 */
export function useTelegramBackButton(index: number, onBack: () => void): void {
  const tg = useTelegram();

  useEffect(() => {
    // Guard is inside tg.backButton.* (chrome.ts). Localhost silently no-ops.
    if (index <= 0) {
      tg.backButton.hide();
      return () => {
        tg.backButton.hide();
      };
    }

    tg.backButton.show();
    const off = tg.backButton.onClick(() => {
      tg.haptics.selection();
      onBack();
    });
    return () => {
      off();
      tg.backButton.hide();
    };
  }, [index, onBack, tg]);
}

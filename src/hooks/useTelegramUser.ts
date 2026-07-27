"use client";
// File responsibility: Telegram user first name + avatar for Home greeter. Fallback demo profile
// when outside TMA. Never reads mock seed from components — default string only.
import { useSignal } from "@telegram-apps/sdk-react";
import { initDataUser } from "@/lib/telegram/signals";

const DEMO_FIRST_NAME = "Aria";

export function useTelegramUser(): {
  firstName: string;
  photoUrl: string | undefined;
  isDemo: boolean;
} {
  const user = useSignal(initDataUser);
  const firstName = user?.first_name?.trim() || DEMO_FIRST_NAME;
  const photoUrl = user?.photo_url;
  return {
    firstName,
    photoUrl,
    isDemo: !user?.first_name,
  };
}

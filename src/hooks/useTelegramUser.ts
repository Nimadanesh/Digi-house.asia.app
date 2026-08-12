"use client";
// File responsibility: greeter identity — TG initData → session user → neutral fallback.
import { useSignal } from "@telegram-apps/sdk-react";
import { initDataUser } from "@/lib/telegram/signals";
import { useAuthStore } from "@/stores/auth.store";
import type { UserProfile } from "@/types/user";

const FALLBACK_FIRST_NAME = "there";

function sessionFirstName(user: UserProfile | null): string | undefined {
  if (!user) return undefined;
  const fromDisplay = user.displayName?.trim().split(/\s+/)[0];
  if (fromDisplay) return fromDisplay;
  const fromUsername = user.username?.trim();
  return fromUsername || undefined;
}

export function useTelegramUser(): {
  firstName: string;
  photoUrl: string | undefined;
  isDemo: boolean;
} {
  const tgUser = useSignal(initDataUser);
  const sessionUser = useAuthStore((s) => s.user);

  const tgFirst = tgUser?.first_name?.trim() || undefined;
  const sessionFirst = sessionFirstName(sessionUser);
  const firstName = tgFirst || sessionFirst || FALLBACK_FIRST_NAME;
  const photoUrl = tgUser?.photo_url || sessionUser?.photoUrl || undefined;

  return {
    firstName,
    photoUrl,
    isDemo: !tgFirst && !sessionFirst,
  };
}

"use client";
// File responsibility: persist onboarded=true to API + local auth store (fail-open).
import { useCallback } from "react";
import { env } from "@/lib/env";
import { getApiAccessToken } from "@/lib/api/session-token";
import { useAuthStore } from "@/stores/auth.store";
import { useSettingsStore } from "@/stores/settings.store";
import type { UserProfile } from "@/types/user";

async function postOnboarded(): Promise<UserProfile | null> {
  if (env.dataSource !== "api" || !env.apiBaseUrl) return null;
  const token = getApiAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(`${env.apiBaseUrl}/v1/me/onboarded`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { user?: UserProfile };
    return body.user ?? null;
  } catch {
    return null;
  }
}

export function useMarkOnboarded(): () => void {
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const setUser = useAuthStore((s) => s.setUser);

  return useCallback(() => {
    setOnboarded(true);
    void postOnboarded().then((user) => {
      if (user) setUser(user);
    });
  }, [setOnboarded, setUser]);
}

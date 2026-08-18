"use client";

import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { retrieveRawInitData } from "@telegram-apps/sdk";
import { env } from "@/lib/env";
import { setApiAccessToken } from "./session-token";
import { onAuthInvalidated } from "./auth-events";
import { useAuthStore } from "@/stores/auth.store";
import { useSettingsStore } from "@/stores/settings.store";
import { USER as MOCK_USER } from "@/lib/mock/seed/user";
import type { UserProfile } from "@/types/user";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

interface AuthTelegramResponse {
  token?: string;
  user: UserProfile;
  expiresAt?: string;
}

interface MeResponse {
  user: UserProfile;
}

export interface AuthContextValue {
  status: AuthStatus;
  user: UserProfile | null;
  error: string | null;
  reauthenticate: () => Promise<void>;
  /** Apply an already-issued session (e.g. recovery login). */
  establishSession: (user: UserProfile, token?: string) => void;
}

export const AuthContext = createContext<AuthContextValue>({
  status: "loading",
  user: null,
  error: null,
  reauthenticate: async () => {},
  establishSession: () => {},
});

function normalizeUser(user: UserProfile): UserProfile {
  return {
    ...user,
    profileCompleted: user.profileCompleted === true,
    onboarded: user.onboarded === true,
  };
}

function publishUser(user: UserProfile | null) {
  useAuthStore.getState().setUser(user);
  if (user?.onboarded) {
    useSettingsStore.getState().setOnboarded(true);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const authInFlight = useRef(false);

  const applySession = useCallback((next: UserProfile | null, nextStatus: AuthStatus) => {
    const normalized = next ? normalizeUser(next) : null;
    setUser(normalized);
    publishUser(normalized);
    setStatus(nextStatus);
  }, []);

  const establishSession = useCallback(
    (next: UserProfile, token?: string) => {
      if (token) setApiAccessToken(token);
      setError(null);
      applySession(next, "authenticated");
    },
    [applySession],
  );

  const doAuth = useCallback(async () => {
    if (authInFlight.current) return;
    authInFlight.current = true;
    setError(null);

    try {
      if (env.dataSource === "mock") {
        applySession(MOCK_USER, "unauthenticated");
        return;
      }

      const baseUrl = env.apiBaseUrl;

      if (env.devToken) {
        setApiAccessToken(env.devToken);
        if (!baseUrl) {
          applySession(null, "authenticated");
          return;
        }
        try {
          const meRes = await fetch(`${baseUrl}/v1/me`, {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${env.devToken}`,
            },
          });
          if (meRes.ok) {
            const me = (await meRes.json()) as MeResponse;
            applySession(me.user, "authenticated");
            return;
          }
        } catch {
          // Dev token without reachable API — still mark authenticated for local tooling.
        }
        applySession(null, "authenticated");
        return;
      }

      let initDataRaw: string | undefined;
      try {
        initDataRaw = retrieveRawInitData();
      } catch {
        initDataRaw = undefined;
      }

      if (!initDataRaw) {
        console.warn(
          "[Auth] No initData available — auth skipped. Set NEXT_PUBLIC_DEV_TOKEN for local dev.",
        );
        applySession(null, "unauthenticated");
        return;
      }

      if (!baseUrl) {
        console.warn("[Auth] NEXT_PUBLIC_API_BASE_URL not set — cannot authenticate");
        applySession(null, "unauthenticated");
        return;
      }

      const res = await fetch(`${baseUrl}/v1/auth/telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ initData: initDataRaw }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(
          (body as { message?: string }).message ?? `HTTP ${res.status}`,
        );
      }

      const data = (await res.json()) as AuthTelegramResponse;
      if (data.token) {
        setApiAccessToken(data.token);
      }
      applySession(data.user, "authenticated");
    } catch (err) {
      console.error("[Auth] Auth failed:", err);
      setError(err instanceof Error ? err.message : "Authentication failed");
      applySession(null, "error");
    } finally {
      authInFlight.current = false;
    }
  }, [applySession]);

  const reauthenticate = useCallback(async () => {
    await doAuth();
  }, [doAuth]);

  useEffect(() => {
    queueMicrotask(() => {
      doAuth();
    });
  }, [doAuth]);

  useEffect(() => {
    onAuthInvalidated(() => {
      applySession(null, "unauthenticated");
    });
  }, [applySession]);

  return (
    <AuthContext.Provider
      value={{ status, user, error, reauthenticate, establishSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

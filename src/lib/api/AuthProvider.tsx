"use client";

import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { retrieveRawInitData } from "@telegram-apps/sdk";
import { env } from "@/lib/env";
import { setApiAccessToken } from "./session-token";
import { onAuthInvalidated } from "./auth-events";
import type { UserProfile } from "@/types/user";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

interface AuthTelegramResponse {
  token?: string;
  user: UserProfile;
  expiresAt?: string;
}

export interface AuthContextValue {
  status: AuthStatus;
  user: UserProfile | null;
  error: string | null;
  reauthenticate: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  status: "loading",
  user: null,
  error: null,
  reauthenticate: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const authInFlight = useRef(false);

  const doAuth = useCallback(async () => {
    if (authInFlight.current) return;
    authInFlight.current = true;
    setError(null);

    try {
      if (env.dataSource === "mock") {
        setStatus("unauthenticated");
        return;
      }

      if (env.devToken) {
        setApiAccessToken(env.devToken);
        setStatus("authenticated");
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
        setStatus("unauthenticated");
        return;
      }

      const baseUrl = env.apiBaseUrl;
      if (!baseUrl) {
        console.warn("[Auth] NEXT_PUBLIC_API_BASE_URL not set — cannot authenticate");
        setStatus("unauthenticated");
        return;
      }

      const res = await fetch(`${baseUrl}/v1/auth/telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ initData: initDataRaw }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }

      const data = (await res.json()) as AuthTelegramResponse;
      if (data.token) {
        setApiAccessToken(data.token);
      }
      setUser(data.user);
      setStatus("authenticated");
    } catch (err) {
      console.error("[Auth] Auth failed:", err);
      setError(err instanceof Error ? err.message : "Authentication failed");
      setStatus("error");
    } finally {
      authInFlight.current = false;
    }
  }, []);

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
      setUser(null);
      setStatus("unauthenticated");
    });
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, error, reauthenticate }}>
      {children}
    </AuthContext.Provider>
  );
}

"use client";
// File responsibility: POST /v1/auth/recovery → session via AuthProvider.
import { useCallback, useState } from "react";
import { env } from "@/lib/env";
import { useApiAuth } from "@/hooks/useApiAuth";
import {
  isValidRecoveryCodeFormat,
  normalizeRecoveryCodeInput,
} from "@/lib/profile";
import type { UserProfile } from "@/types/user";

export function useRecoveryLogin(): {
  loginWithRecoveryCode: (code: string) => Promise<UserProfile>;
  pending: boolean;
  error: string | null;
} {
  const { establishSession } = useApiAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginWithRecoveryCode = useCallback(
    async (raw: string): Promise<UserProfile> => {
      setPending(true);
      setError(null);
      try {
        const code = normalizeRecoveryCodeInput(raw);
        if (!isValidRecoveryCodeFormat(code)) {
          throw new Error("Enter a valid code (DH-XXXX-XXXX)");
        }
        if (env.dataSource === "mock") {
          throw new Error("Recovery login requires API mode");
        }
        if (!env.apiBaseUrl) throw new Error("API not configured");

        const res = await fetch(`${env.apiBaseUrl}/v1/auth/recovery`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            message?: string;
          };
          throw new Error(body.message ?? "Invalid recovery code");
        }
        const data = (await res.json()) as {
          token: string;
          user: UserProfile;
        };
        establishSession(data.user, data.token);
        return data.user;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Login failed";
        setError(msg);
        throw e;
      } finally {
        setPending(false);
      }
    },
    [establishSession],
  );

  return { loginWithRecoveryCode, pending, error };
}

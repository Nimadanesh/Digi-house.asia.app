"use client";
// File responsibility: POST /v1/me/withdrawal-address — save/change the USDT withdrawal
// address (PE-01); updates session like useUpdateProfile.
import { useCallback, useState } from "react";
import { env } from "@/lib/env";
import { getApiAccessToken } from "@/lib/api/session-token";
import { useApiAuth } from "@/hooks/useApiAuth";
import { useAuthStore } from "@/stores/auth.store";
import type { UserProfile } from "@/types/user";

export function useWithdrawalAddress(): {
  saveAddress: (address: string) => Promise<UserProfile>;
  pending: boolean;
  error: string | null;
} {
  const { establishSession } = useApiAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveAddress = useCallback(
    async (address: string): Promise<UserProfile> => {
      setPending(true);
      setError(null);
      try {
        if (env.dataSource === "mock") {
          const cur = useAuthStore.getState().user;
          if (!cur) throw new Error("Not signed in");
          const next: UserProfile = {
            ...cur,
            withdrawalAddress: address,
            // Any change invalidates verification (mirrors the API).
            withdrawalAddressVerified: false,
          };
          setUser(next);
          return next;
        }
        const token = getApiAccessToken();
        if (!env.apiBaseUrl || !token) throw new Error("Not signed in");
        const res = await fetch(`${env.apiBaseUrl}/v1/me/withdrawal-address`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ address }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            message?: string;
          };
          throw new Error(body.message ?? `HTTP ${res.status}`);
        }
        const data = (await res.json()) as { user: UserProfile };
        establishSession(data.user);
        return data.user;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Save failed";
        setError(msg);
        throw e;
      } finally {
        setPending(false);
      }
    },
    [establishSession, setUser],
  );

  return { saveAddress, pending, error };
}

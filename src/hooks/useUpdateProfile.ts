"use client";
// File responsibility: PATCH /v1/me profile + completeProfile; updates session.
import { useCallback, useState } from "react";
import { env } from "@/lib/env";
import { getApiAccessToken } from "@/lib/api/session-token";
import { useApiAuth } from "@/hooks/useApiAuth";
import { useAuthStore } from "@/stores/auth.store";
import type { UserProfile } from "@/types/user";

export type UpdateProfileInput = {
  displayName?: string;
  phone?: string | null;
  completeProfile?: boolean;
};

export function useUpdateProfile(): {
  updateProfile: (input: UpdateProfileInput) => Promise<UserProfile>;
  pending: boolean;
  error: string | null;
} {
  const { establishSession } = useApiAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(
    async (input: UpdateProfileInput): Promise<UserProfile> => {
      setPending(true);
      setError(null);
      try {
        if (env.dataSource === "mock") {
          const cur = useAuthStore.getState().user;
          if (!cur) throw new Error("Not signed in");
          const next: UserProfile = {
            ...cur,
            displayName: input.displayName ?? cur.displayName,
            phone:
              input.phone === undefined
                ? cur.phone
                : input.phone ?? undefined,
            profileCompleted: input.completeProfile
              ? true
              : cur.profileCompleted,
          };
          setUser(next);
          return next;
        }
        const token = getApiAccessToken();
        if (!env.apiBaseUrl || !token) throw new Error("Not signed in");
        const res = await fetch(`${env.apiBaseUrl}/v1/me`, {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(input),
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
        const msg = e instanceof Error ? e.message : "Update failed";
        setError(msg);
        throw e;
      } finally {
        setPending(false);
      }
    },
    [establishSession, setUser],
  );

  return { updateProfile, pending, error };
}

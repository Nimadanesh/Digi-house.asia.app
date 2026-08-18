"use client";
// File responsibility: fetch owner recovery code (API) or mock seed code.
import { useQuery } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { getApiAccessToken } from "@/lib/api/session-token";
import { MOCK_RECOVERY_CODE } from "@/lib/mock/seed/user";
import { useAuthStore } from "@/stores/auth.store";

export function useRecoveryCode(): {
  code: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const userId = useAuthStore((s) => s.user?.id);

  const query = useQuery({
    queryKey: ["recovery-code", userId],
    enabled: Boolean(userId),
    staleTime: Infinity,
    queryFn: async () => {
      if (env.dataSource === "mock") {
        return MOCK_RECOVERY_CODE;
      }
      const token = getApiAccessToken();
      if (!env.apiBaseUrl || !token) {
        throw new Error("Not signed in");
      }
      const res = await fetch(`${env.apiBaseUrl}/v1/me/recovery-code`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as { recoveryCode: string };
      return data.recoveryCode;
    },
  });

  return {
    code: query.data ?? null,
    loading: query.isPending,
    error: query.error instanceof Error ? query.error.message : null,
    refresh: () => query.refetch().then(() => undefined),
  };
}

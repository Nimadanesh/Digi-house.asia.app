"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRepo } from "@/lib/api/getRepo";
import { haptics } from "@/lib/telegram/haptics";

/** USDT withdrawal requests (PE-02) — newest first, for Settings. */
export function useWithdrawals() {
  return useQuery({
    queryKey: ["withdrawals"],
    queryFn: () => getRepo().withdrawals.list(),
    staleTime: 30_000,
  });
}

/** Request a payout from the withdrawable balance (debits atomically on the API). */
export function useRequestWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { amountUsd: number }) =>
      getRepo().withdrawals.request(input),
    onSuccess: () => {
      void haptics.notification("success");
      void qc.invalidateQueries({ queryKey: ["withdrawals"] });
      void qc.invalidateQueries({ queryKey: ["meSummary"] });
    },
    onError: () => {
      void haptics.notification("error");
    },
  });
}

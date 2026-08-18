"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRepo } from "@/lib/api/getRepo";
import type { PayoutPeriod, ShareLock } from "@/types/lock";
import { haptics } from "@/lib/telegram/haptics";

export function useLocks() {
  return useQuery({
    queryKey: ["locks"],
    queryFn: () => getRepo().locks.list(),
    staleTime: 60_000,
  });
}

export function useMeSummary() {
  return useQuery({
    queryKey: ["meSummary"],
    queryFn: () => getRepo().me.summary(),
    staleTime: 60_000,
  });
}

function useInvalidateLocks() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["locks"] });
    void qc.invalidateQueries({ queryKey: ["meSummary"] });
    void qc.invalidateQueries({ queryKey: ["portfolio"] });
    void qc.invalidateQueries({ queryKey: ["earnings"] });
  };
}

export function useCreateLock() {
  const invalidate = useInvalidateLocks();
  return useMutation({
    mutationFn: (input: { propertyId: string; shares: number; payoutPeriod: PayoutPeriod }) =>
      getRepo().locks.create(input),
    onSuccess: () => {
      void haptics.notification("success");
      invalidate();
    },
    onError: () => {
      void haptics.notification("error");
    },
  });
}

export function useRequestUnlock() {
  const invalidate = useInvalidateLocks();
  return useMutation({
    mutationFn: (lockId: string) => getRepo().locks.requestUnlock(lockId),
    onSuccess: () => {
      void haptics.notification("success");
      invalidate();
    },
    onError: () => {
      void haptics.notification("error");
    },
  });
}

/** Active (non-matured) locks for one property, or an empty array while loading. */
export function activeLocksForProperty(
  locks: ShareLock[] | undefined,
  propertyId: string,
): ShareLock[] {
  return (locks ?? []).filter(
    (l) => l.propertyId === propertyId && l.status !== "matured",
  );
}

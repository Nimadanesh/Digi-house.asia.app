"use client";
import { payoutCountdownLong } from "@/lib/format";
import { useSharedNowMs } from "@/hooks/useSharedNowMs";

export function usePayoutCountdownLong(): string {
  return payoutCountdownLong(useSharedNowMs());
}

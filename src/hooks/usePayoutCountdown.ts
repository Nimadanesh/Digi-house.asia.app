"use client";
import { payoutCountdown } from "@/lib/format";
import { useSharedNowMs } from "@/hooks/useSharedNowMs";

export function usePayoutCountdown(): string {
  return payoutCountdown(useSharedNowMs());
}

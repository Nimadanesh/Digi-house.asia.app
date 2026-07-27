"use client";
import { payoutCountdownDhms } from "@/lib/format";
import { useSharedNowMs } from "@/hooks/useSharedNowMs";

export function usePayoutCountdownDhms(): string {
  return payoutCountdownDhms(useSharedNowMs());
}

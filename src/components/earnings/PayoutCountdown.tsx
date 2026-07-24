"use client";
// File responsibility: render the next-Friday payout countdown readout (text only, reduced-motion safe).
import { usePayoutCountdown } from "@/hooks/usePayoutCountdown";

export function PayoutCountdown() {
  const text = usePayoutCountdown();
  return <span className="text-xs text-muted-foreground tnum">Next payout Fri · {text}</span>;
}
"use client";
// File responsibility: 1s ticker hook returning a textual payout countdown to next Friday 00:00 UTC.
// Pure UI time-keeper — no network, no wallet. Honors reduced-motion implicitly (it's text, no animation).
import { useEffect, useState } from "react";
import { payoutCountdown } from "@/lib/format";

export function usePayoutCountdown(): string {
  const [text, setText] = useState<string>(() => payoutCountdown(Date.now()));
  useEffect(() => {
    const id = setInterval(() => setText(payoutCountdown(Date.now())), 1000);
    return () => clearInterval(id);
  }, []);
  return text;
}
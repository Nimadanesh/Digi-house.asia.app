"use client";
import { usePathname } from "next/navigation";
import { useTelegram } from "@/hooks/useTelegram";

// Phase 2 shell: no screen carries a primary action yet (Buy/Place Order arrive in Phase 3).
// Hide MainButton on all routes. The bridge exists so Phase 3 just swaps in per-route setParams().
export function MainButtonBridge() {
  const { mainButton } = useTelegram();
  usePathname(); // re-render on route change
  mainButton.hide();
  return null;
}
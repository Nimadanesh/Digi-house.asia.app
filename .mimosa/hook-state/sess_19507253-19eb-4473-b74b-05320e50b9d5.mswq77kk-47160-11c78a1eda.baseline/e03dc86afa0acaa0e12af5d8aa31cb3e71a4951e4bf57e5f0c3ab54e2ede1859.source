"use client";
// File responsibility: safe haptic wrappers. No-op if unsupported or reduced-motion.
import { hapticFeedback } from "./signals";

function reducedMotion(): boolean {
  return typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export const haptics = {
  impact(style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light") {
    if (reducedMotion()) return;
    try { hapticFeedback.impactOccurred(style as never); } catch { /* unsupported */ }
  },
  notification(type: "error" | "success" | "warning") {
    if (reducedMotion()) return;
    try { hapticFeedback.notificationOccurred(type as never); } catch { /* unsupported */ }
  },
  selection() {
    if (reducedMotion()) return;
    try { hapticFeedback.selectionChanged(); } catch { /* unsupported */ }
  },
};
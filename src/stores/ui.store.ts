"use client";
// File responsibility: ephemeral UI slice — MainButton tab-bar chrome, settings sheet,
// onboarding replay, and the global toast slot (DESIGN_SYSTEM §Toast). Single-slot:
// a new toast replaces the previous one — calm money, never a toast stack.
import { create } from "zustand";

export type ToastTone = "success" | "error";

export interface UiToast {
  id: number;
  tone: ToastTone;
  title: string;
  sub?: string;
  /** Drives the two-stage exit animation (ToastHost owns the timers). */
  leaving: boolean;
}

interface UiState {
  /** Latest toast or null. Use pushToast(); ToastHost owns lifecycle. */
  toast: UiToast | null;
  pushToast: (tone: ToastTone, title: string, sub?: string) => void;
  markToastLeaving: () => void;
  clearToast: () => void;
  settingsOpen: boolean;
  /** When true, OnboardingGate allows /onboarding even if already onboarded (Settings replay). */
  onboardingReplay: boolean;
  mainButtonActive: boolean; // true while a screen owns the Telegram MainButton
  /** True while an in-page sticky bottom CTA is on screen — floating chrome (demo badge) yields. */
  stickyCtaVisible: boolean;
  setSettingsOpen: (v: boolean) => void;
  openSettings: () => void;
  closeSettings: () => void;
  setOnboardingReplay: (v: boolean) => void;
  setMainButtonActive: (v: boolean) => void;
  setStickyCtaVisible: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  toast: null,
  pushToast: (tone, title, sub) =>
    set({ toast: { id: Date.now(), tone, title, sub, leaving: false } }),
  markToastLeaving: () => set((s) => (s.toast ? { toast: { ...s.toast, leaving: true } } : s)),
  clearToast: () => set({ toast: null }),
  settingsOpen: false,
  onboardingReplay: false,
  mainButtonActive: false,
  stickyCtaVisible: false,
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  setOnboardingReplay: (onboardingReplay) => set({ onboardingReplay }),
  setMainButtonActive: (mainButtonActive) => set({ mainButtonActive }),
  setStickyCtaVisible: (stickyCtaVisible) => set({ stickyCtaVisible }),
}));

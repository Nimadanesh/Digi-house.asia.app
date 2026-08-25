"use client";
// File responsibility: ephemeral UI slice — MainButton tab-bar chrome, settings sheet, onboarding replay.
import { create } from "zustand";

interface UiState {
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

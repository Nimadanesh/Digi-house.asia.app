"use client";
// File responsibility: persisted user settings (onboarded/theme/currency/demo badge). Minimal.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserRole } from "@/types/user";

export type DisplayCurrency = "usd" | "ton";

interface SettingsState {
  role: UserRole | null;
  onboarded: boolean;
  useTelegramTheme: boolean; // default false -> DigiHouse static palette
  displayCurrency: DisplayCurrency;
  /** Floating "Demo" pill on main shell (honest MVP label). Default on for competition pitch. */
  showDemoBadge: boolean;
  setRole: (r: UserRole) => void;
  setOnboarded: (v: boolean) => void;
  setUseTelegramTheme: (v: boolean) => void;
  setDisplayCurrency: (c: DisplayCurrency) => void;
  setShowDemoBadge: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      role: null,
      onboarded: false,
      useTelegramTheme: false,
      displayCurrency: "usd",
      showDemoBadge: true,
      setRole: (role) => set({ role }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setUseTelegramTheme: (useTelegramTheme) => set({ useTelegramTheme }),
      setDisplayCurrency: (displayCurrency) => set({ displayCurrency }),
      setShowDemoBadge: (showDemoBadge) => set({ showDemoBadge }),
    }),
    {
      name: "digihouse-settings",
      storage: createJSONStorage(() =>
        typeof localStorage !== "undefined" ? localStorage : (undefined as unknown as Storage),
      ),
      partialize: (s) => ({
        role: s.role,
        onboarded: s.onboarded,
        useTelegramTheme: s.useTelegramTheme,
        displayCurrency: s.displayCurrency,
        showDemoBadge: s.showDemoBadge,
      }),
    },
  ),
);

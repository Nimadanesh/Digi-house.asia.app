"use client";
// File responsibility: persisted user settings (onboarded/theme/currency/locale/demo badge).
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserRole } from "@/types/user";
import type { AppLocale } from "@/i18n/config";

export type DisplayCurrency = "usd" | "ton";

interface SettingsState {
  role: UserRole | null;
  onboarded: boolean;
  useTelegramTheme: boolean; // default false -> FractionalLuxe static palette
  displayCurrency: DisplayCurrency;
  /** null = auto-detect from Telegram language_code / browser. */
  locale: AppLocale | null;
  /** Floating "Demo" pill on main shell (honest MVP label). Default on for competition pitch. */
  showDemoBadge: boolean;
  /** True after persist rehydration (client). */
  _hasHydrated: boolean;
  setRole: (r: UserRole) => void;
  setOnboarded: (v: boolean) => void;
  setUseTelegramTheme: (v: boolean) => void;
  setDisplayCurrency: (c: DisplayCurrency) => void;
  setLocale: (locale: AppLocale | null) => void;
  setShowDemoBadge: (v: boolean) => void;
  setHasHydrated: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      role: null,
      onboarded: false,
      useTelegramTheme: false,
      displayCurrency: "usd",
      locale: null,
      showDemoBadge: true,
      _hasHydrated: false,
      setRole: (role) => set({ role }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setUseTelegramTheme: (useTelegramTheme) => set({ useTelegramTheme }),
      setDisplayCurrency: (displayCurrency) => set({ displayCurrency }),
      setLocale: (locale) => set({ locale }),
      setShowDemoBadge: (showDemoBadge) => set({ showDemoBadge }),
      setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),
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
        locale: s.locale,
        showDemoBadge: s.showDemoBadge,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

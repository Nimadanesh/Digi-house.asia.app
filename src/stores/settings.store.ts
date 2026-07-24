"use client";
// File responsibility: persisted user settings slice (role/onboarded/telegram-theme). Minimal.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserRole } from "@/types/user";

interface SettingsState {
  role: UserRole | null;
  onboarded: boolean;
  useTelegramTheme: boolean; // default false -> DigiHouse static palette
  setRole: (r: UserRole) => void;
  setOnboarded: (v: boolean) => void;
  setUseTelegramTheme: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      role: null,
      onboarded: false,
      useTelegramTheme: false,
      setRole: (role) => set({ role }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setUseTelegramTheme: (useTelegramTheme) => set({ useTelegramTheme }),
    }),
    {
      name: "digihouse-settings",
      storage: createJSONStorage(() =>
        typeof localStorage !== "undefined" ? localStorage : (undefined as unknown as Storage),
      ),
      partialize: (s) => ({ role: s.role, onboarded: s.onboarded, useTelegramTheme: s.useTelegramTheme }),
    },
  ),
);
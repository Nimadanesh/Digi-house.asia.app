"use client";
// File responsibility: persisted user settings (onboarded/theme/currency/locale/demo badge).
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserRole } from "@/types/user";
import type { AppLocale } from "@/i18n/config";
import { detectNetwork, type PayoutNetwork } from "@/lib/addresses";

export type DisplayCurrency = "usd" | "ton";

export interface NotificationPrefs {
  payoutReceived: boolean;
  withdrawalUpdates: boolean;
  marketAlerts: boolean;
}

export interface BookAddress {
  address: string;
  network: PayoutNetwork;
}

interface SettingsState {
  role: UserRole | null;
  onboarded: boolean;
  useTelegramTheme: boolean; // default false -> FractionalLuxe static palette
  displayCurrency: DisplayCurrency;
  /** null = auto-detect from Telegram language_code / browser. */
  locale: AppLocale | null;
  /** Floating "Demo" pill on main shell (honest MVP label). Default on for competition pitch. */
  showDemoBadge: boolean;
  /** Simple notification toggles (local-only preferences). */
  notifications: NotificationPrefs;
  /** Local address book of extra payout destinations (account primary lives in auth.user). */
  addressBook: BookAddress[];
  /** True after persist rehydration (client). */
  _hasHydrated: boolean;
  setRole: (r: UserRole) => void;
  setOnboarded: (v: boolean) => void;
  setUseTelegramTheme: (v: boolean) => void;
  setDisplayCurrency: (c: DisplayCurrency) => void;
  setLocale: (locale: AppLocale | null) => void;
  setShowDemoBadge: (v: boolean) => void;
  setNotification: (key: keyof NotificationPrefs, v: boolean) => void;
  addBookAddress: (address: string, network?: PayoutNetwork) => void;
  removeBookAddress: (address: string) => void;
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
      notifications: { payoutReceived: true, withdrawalUpdates: true, marketAlerts: false },
      addressBook: [],
      _hasHydrated: false,
      setRole: (role) => set({ role }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setUseTelegramTheme: (useTelegramTheme) => set({ useTelegramTheme }),
      setDisplayCurrency: (displayCurrency) => set({ displayCurrency }),
      setLocale: (locale) => set({ locale }),
      setShowDemoBadge: (showDemoBadge) => set({ showDemoBadge }),
      setNotification: (key, v) =>
        set((s) => ({ notifications: { ...s.notifications, [key]: v } })),
      addBookAddress: (address, network = detectNetwork(address)) =>
        set((s) =>
          s.addressBook.some((e) => e.address === address)
            ? s
            : { addressBook: [...s.addressBook, { address, network }] },
        ),
      removeBookAddress: (address) =>
        set((s) => ({ addressBook: s.addressBook.filter((e) => e.address !== address) })),
      setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),
    }),
    {
      name: "digihouse-settings",
      version: 1,
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
        notifications: s.notifications,
        addressBook: s.addressBook,
      }),
      // v0 stored plain address strings — upgrade them with shape-detected networks.
      migrate: (persisted: unknown) => {
        const s = (persisted ?? {}) as Record<string, unknown>;
        if (Array.isArray(s.addressBook)) {
          s.addressBook = (s.addressBook as unknown[]).map((e) =>
            typeof e === "string"
              ? { address: e, network: detectNetwork(e) }
              : e,
          );
        }
        return s;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

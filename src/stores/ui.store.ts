"use client";
// File responsibility: ephemeral UI slice — active tab, selected property, sheet flags, payout cursor,
// mainButtonActive flag (true on action screens so AppShell hides the tab bar and reserves MainButton space).
import { create } from "zustand";

interface UiState {
  activeTab: string;
  selectedPropertyId: string | null;
  sheetOpen: boolean;
  payoutCursor: number; // epoch ms last tickPayout
  mainButtonActive: boolean; // true while a screen owns the Telegram MainButton
  setActiveTab: (href: string) => void;
  setSelectedPropertyId: (id: string | null) => void;
  setSheetOpen: (v: boolean) => void;
  setPayoutCursor: (ms: number) => void;
  setMainButtonActive: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: "/home",
  selectedPropertyId: null,
  sheetOpen: false,
  payoutCursor: 0,
  mainButtonActive: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedPropertyId: (selectedPropertyId) => set({ selectedPropertyId }),
  setSheetOpen: (sheetOpen) => set({ sheetOpen }),
  setPayoutCursor: (payoutCursor) => set({ payoutCursor }),
  setMainButtonActive: (mainButtonActive) => set({ mainButtonActive }),
}));
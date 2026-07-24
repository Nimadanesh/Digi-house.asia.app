"use client";
// File responsibility: ephemeral UI slice — active tab, selected property, sheet flags, payout cursor.
import { create } from "zustand";

interface UiState {
  activeTab: string;
  selectedPropertyId: string | null;
  sheetOpen: boolean;
  payoutCursor: number; // epoch ms last tickPayout
  setActiveTab: (href: string) => void;
  setSelectedPropertyId: (id: string | null) => void;
  setSheetOpen: (v: boolean) => void;
  setPayoutCursor: (ms: number) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: "/home",
  selectedPropertyId: null,
  sheetOpen: false,
  payoutCursor: 0,
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedPropertyId: (selectedPropertyId) => set({ selectedPropertyId }),
  setSheetOpen: (sheetOpen) => set({ sheetOpen }),
  setPayoutCursor: (payoutCursor) => set({ payoutCursor }),
}));
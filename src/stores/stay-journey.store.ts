"use client";
// File responsibility: complimentary stay journey prototype state — member
// preference + future allocation slot. PROTOTYPE: in-memory only, resets on
// reload; allocation stays null until a real allocation engine populates it.
// Shape mirrors the StayJourneyState contract so persistence can adopt it
// without rework. No booking, no lottery, no backend.
import { create } from "zustand";

import type { StayAllocation, StayPreference } from "@/lib/club/stay-journey";

interface StayJourneyStore {
  preference: StayPreference | null;
  allocation: StayAllocation | null;
  setPreference: (preference: StayPreference) => void;
  clearPreference: () => void;
}

export const useStayJourneyStore = create<StayJourneyStore>((set) => ({
  preference: null,
  allocation: null,
  setPreference: (preference) => set({ preference }),
  clearPreference: () => set({ preference: null }),
}));

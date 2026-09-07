// File responsibility: Slice E view-model hook — the single integration boundary
// between Estate Detail UI and the canonical engines. Components consume this
// hook (per the UI → hooks → lib layering); engine modules stay out of JSX.
import { useMemo, useState } from "react";

import type { OrderBookLevel } from "@/types/order";
import type { Listing } from "@/types/property";
import {
  buildEstateDetailViewModel,
  selectScenarioEconomics,
  type EstateDetailViewModel,
  type ScenarioBound,
  type SelectedScenario,
} from "@/lib/economics/estate-detail-view-model";

export type { EstateDetailViewModel, ScenarioBound, SelectedScenario };

export function useEstateDetailViewModel(
  listing: Listing,
  {
    asks,
    sharesOwned = 0,
    acquisitionPricePerShareUsd = null,
  }: {
    asks?: OrderBookLevel[];
    sharesOwned?: number;
    acquisitionPricePerShareUsd?: number | null;
  } = {},
): {
  vm: EstateDetailViewModel;
  bound: ScenarioBound;
  onBoundChange: (bound: ScenarioBound) => void;
  selected: SelectedScenario | null;
} {
  const vm = useMemo(
    () =>
      buildEstateDetailViewModel(listing, {
        asks,
        sharesOwned,
        acquisitionPricePerShareUsd,
      }),
    [listing, asks, sharesOwned, acquisitionPricePerShareUsd],
  );
  // Per-estate bound selection (UI state — never written back to the estate).
  const [boundByListing, setBoundByListing] = useState<Partial<Record<string, ScenarioBound>>>({});
  const bound = boundByListing[listing.id] ?? "base";
  function onBoundChange(next: ScenarioBound) {
    setBoundByListing((prev) => ({ ...prev, [listing.id]: next }));
  }
  return { vm, bound, onBoundChange, selected: selectScenarioEconomics(vm, bound) };
}

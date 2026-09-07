"use client";
// File responsibility: Slice F marketplace hook — the single integration
// boundary between Marketplace UI and canonical data (UI → hooks → lib).
// Wraps useMarketplace (Listing facts) and memoizes the canonical view model.
// Components consume MarketplaceEstate; engines/canonical stay out of JSX.
import { useMemo } from "react";
import { useMarketplace } from "@/hooks/useMarketplace";
import {
  toMarketplaceEstates,
  type MarketplaceEstate,
} from "@/lib/economics/marketplace-view-model";
import type { PropertyStatus } from "@/types/property";

export type { MarketplaceEstate };

export function useMarketplaceEstates(filter?: {
  status?: PropertyStatus;
  query?: string;
}) {
  const query = useMarketplace(filter);
  const estates = useMemo(
    () => toMarketplaceEstates(query.data ?? []),
    [query.data],
  );
  return { ...query, estates };
}

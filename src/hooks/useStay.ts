"use client";
// File responsibility: fetch the Owner Stay snapshot for a property (Slice 1 StayRepo
// contract). The mock always resolves to an honest unavailable state; the real backend
// swaps in via getRepo().stay.get(id) with no UI change.
import { useQuery } from "@tanstack/react-query";
import { getRepo } from "@/lib/api/getRepo";

export function useStay(propertyId: string | null) {
  return useQuery({
    queryKey: ["stay", propertyId],
    queryFn: () => getRepo().stay.get(propertyId!),
    enabled: Boolean(propertyId),
    staleTime: 60_000,
  });
}

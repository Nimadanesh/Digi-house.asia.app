"use client";
// File responsibility: fetch a single Listing by id. Used by Property detail (Task 3).
import { useQuery } from "@tanstack/react-query";
import { getRepo } from "@/lib/api/getRepo";

export function useProperty(propertyId: string | null) {
  return useQuery({
    queryKey: ["property", propertyId],
    queryFn: () => getRepo().marketplace.get(propertyId!),
    enabled: Boolean(propertyId),
    staleTime: 30_000,
  });
}
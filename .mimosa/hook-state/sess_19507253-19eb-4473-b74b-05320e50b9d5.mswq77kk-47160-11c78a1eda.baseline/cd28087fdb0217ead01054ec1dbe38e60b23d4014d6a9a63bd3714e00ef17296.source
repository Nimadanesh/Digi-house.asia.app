"use client";
import { useQuery } from "@tanstack/react-query";
import { getRepo } from "@/lib/api/getRepo";

export function useOrderBook(propertyId: string | null) {
  return useQuery({
    queryKey: ["orderBook", propertyId],
    queryFn: () => getRepo().orderBook.get(propertyId!),
    enabled: Boolean(propertyId),
    staleTime: 60_000,
  });
}
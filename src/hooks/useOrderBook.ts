"use client";
import { useQuery } from "@tanstack/react-query";
import { getRepo } from "@/lib/api/getRepo";

/**
 * Secondary-market order book for a property (PD-04/PD-05).
 * `live: true` polls every 5s so the book reflects new fills/orders while the
 * trade section is on screen (polling fallback — the API SSE stream is the
 * future upgrade path; the mock has no SSE so polling keeps both in sync).
 */
export function useOrderBook(propertyId: string | null, opts: { live?: boolean } = {}) {
  const live = opts.live ?? false;
  return useQuery({
    queryKey: ["orderBook", propertyId],
    queryFn: () => getRepo().orderBook.get(propertyId!),
    enabled: Boolean(propertyId),
    staleTime: live ? 5_000 : 60_000,
    refetchInterval: live ? 5_000 : false,
  });
}
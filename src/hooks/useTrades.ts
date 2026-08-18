"use client";
import { useQuery } from "@tanstack/react-query";
import { getRepo } from "@/lib/api/getRepo";

/**
 * Recent executed fills on the secondary market (PD-04/PD-06), newest first.
 * `live: true` polls every 5s alongside the order book.
 */
export function useTrades(propertyId: string | null, opts: { live?: boolean } = {}) {
  const live = opts.live ?? false;
  return useQuery({
    queryKey: ["trades", propertyId],
    queryFn: () => getRepo().orderBook.trades(propertyId!),
    enabled: Boolean(propertyId),
    staleTime: live ? 5_000 : 60_000,
    refetchInterval: live ? 5_000 : false,
  });
}

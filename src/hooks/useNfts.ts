"use client";
// File responsibility: collectible-NFT receipts for the portfolio (Phase 9).
import { useQuery } from "@tanstack/react-query";
import { getRepo } from "@/lib/api/getRepo";

/** Collectible Position NFTs for the user's holdings — display-only receipts. */
export function useNfts() {
  return useQuery({
    queryKey: ["nfts"],
    queryFn: () => getRepo().nfts.list(),
    staleTime: 30_000,
  });
}

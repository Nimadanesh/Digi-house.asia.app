"use client";
// File responsibility: earnings summary query (frozen demo ledger — no live tick).
import { useQuery } from "@tanstack/react-query";
import { getRepo } from "@/lib/api/getRepo";

export function useEarnings() {
  return useQuery({
    queryKey: ["earnings"],
    queryFn: () => getRepo().earnings.summary(),
    staleTime: 60_000,
  });
}

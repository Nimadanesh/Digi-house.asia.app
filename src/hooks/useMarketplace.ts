"use client";
import { useQuery } from "@tanstack/react-query";
import { getRepo } from "@/lib/api/getRepo";
import type { PropertyStatus } from "@/types/property";

export function useMarketplace(filter?: { status?: PropertyStatus; query?: string }) {
  return useQuery({
    queryKey: ["marketplace", filter ?? null],
    queryFn: () => getRepo().marketplace.list(filter),
    staleTime: 30_000,
  });
}
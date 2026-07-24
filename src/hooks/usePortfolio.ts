"use client";
import { useQuery } from "@tanstack/react-query";
import { getRepo } from "@/lib/api/getRepo";

export function usePortfolio() {
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: () => getRepo().portfolio.summary(),
    staleTime: 0,
  });
}
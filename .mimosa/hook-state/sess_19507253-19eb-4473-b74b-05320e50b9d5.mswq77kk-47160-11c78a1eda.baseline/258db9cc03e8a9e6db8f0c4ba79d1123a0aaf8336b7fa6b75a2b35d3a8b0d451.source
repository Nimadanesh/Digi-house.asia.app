"use client";
import { useQuery } from "@tanstack/react-query";
import { getRepo } from "@/lib/api/getRepo";

export function useFees() {
  return useQuery({
    queryKey: ["fees"],
    queryFn: () => getRepo().fees.list(),
    staleTime: 300_000,
  });
}

"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getRepo } from "@/lib/api/getRepo";
import { env } from "@/lib/env";

export function useEarnings() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["earnings"],
    queryFn: () => getRepo().earnings.summary(),
    staleTime: 0,
  });
  useEffect(() => {
    const id = setInterval(async () => {
      const r = await getRepo().earnings.tickPayout();
      if (r.paidEntries > 0) qc.invalidateQueries({ queryKey: ["earnings"] });
    }, env.payoutTickMs);
    return () => clearInterval(id);
  }, [qc]);
  return query;
}
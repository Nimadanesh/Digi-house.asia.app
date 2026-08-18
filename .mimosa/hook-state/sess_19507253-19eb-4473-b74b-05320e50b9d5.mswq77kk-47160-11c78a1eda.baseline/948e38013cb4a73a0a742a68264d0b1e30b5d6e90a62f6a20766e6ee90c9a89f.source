"use client";
// File responsibility: earnings summary query + one app-wide mock payout tick (not per-mount).
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getRepo } from "@/lib/api/getRepo";
import { env } from "@/lib/env";

let tickTimer: ReturnType<typeof setInterval> | null = null;
let tickSubs = 0;
let tickQc: QueryClient | null = null;

function startSharedTick(qc: QueryClient) {
  // Server-side worker owns tick payouts when DATA_SOURCE=api — no client interval.
  if (env.dataSource === "api") return;
  tickQc = qc;
  tickSubs += 1;
  if (tickTimer != null) return;
  tickTimer = setInterval(() => {
    void getRepo()
      .earnings.tickPayout()
      .then((r) => {
        if (r.paidEntries > 0 && tickQc) {
          void tickQc.invalidateQueries({ queryKey: ["earnings"] });
        }
      })
      .catch(() => {
        /* mock tickPayout never throws in MVP */
      });
  }, env.payoutTickMs);
}

function stopSharedTick() {
  tickSubs = Math.max(0, tickSubs - 1);
  if (tickSubs > 0 || tickTimer == null) return;
  clearInterval(tickTimer);
  tickTimer = null;
  tickQc = null;
}

export function useEarnings() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["earnings"],
    queryFn: () => getRepo().earnings.summary(),
    staleTime: 60_000,
  });

  useEffect(() => {
    startSharedTick(qc);
    return () => stopSharedTick();
  }, [qc]);

  return query;
}

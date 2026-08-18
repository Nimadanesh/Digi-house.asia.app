"use client";
// File responsibility: recent executed fills on the secondary market (PD-06).
// DESIGN_SYSTEM: grouped Block, SectionLabel header, inset hairline rows, tabular-nums money.
// Price tinted green/red only for finance up/down vs. the previous (older) trade.
import { useTrades } from "@/hooks/useTrades";
import { usd, timeAgo } from "@/lib/format";
import { Block } from "@/components/common/Block";
import { SectionLabel } from "@/components/common/SectionLabel";
import { Skeleton } from "@/components/common/Skeleton";

export function RecentTrades({ propertyId }: { propertyId: string }) {
  const { data, isLoading, isError } = useTrades(propertyId, { live: true });

  return (
    <Block className="overflow-hidden" data-testid="recent-trades">
      <div className="px-4 py-2">
        <SectionLabel>Recent trades</SectionLabel>
      </div>
      {isLoading && !data ? (
        <div className="space-y-2 px-4 pb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      ) : isError && !data ? (
        <p className="px-4 pb-4 text-xs text-muted-foreground">Couldn&apos;t load recent trades.</p>
      ) : !data || data.length === 0 ? (
        <p className="px-4 pb-4 text-xs text-muted-foreground" data-testid="trades-empty">
          No trades yet — the market opens when the primary offering sells out.
        </p>
      ) : (
        <div className="px-4 pb-3 text-xs font-mono" data-testid="trades-list">
          {data.map((t, i) => {
            const prev = data[i + 1];
            const dir = prev ? Math.sign(t.priceUsd - prev.priceUsd) : 0;
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 tnum py-1.5 border-t border-border first:border-t-0"
                data-testid="trade-row"
              >
                <span
                  className={`min-w-[72px] font-semibold ${
                    dir > 0 ? "text-success" : dir < 0 ? "text-danger" : "text-foreground"
                  }`}
                >
                  {usd(t.priceUsd)}
                </span>
                <span className="min-w-[36px] text-right text-muted-foreground">{t.quantity}</span>
                <span className="ml-auto shrink-0 text-muted-foreground">{timeAgo(t.createdAt)}</span>
              </div>
            );
          })}
        </div>
      )}
    </Block>
  );
}

"use client";
// File responsibility: Yield & lock section on Property detail (PRODUCT-PLAN §0.4 / PB-08).
// Shows the property's monthly yield rate, the user's locked/free position, lock rows
// with unlock requests, and hosts the Lock/Sell sheets. Redesign Phase 6: the sheet
// itself lives in LockSheet.tsx so other surfaces (ownership banner) can reuse it.
import { useState } from "react";
import { Lock, LockOpen, TrendingDown } from "lucide-react";
import type { Listing } from "@/types/property";
import { usd } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useLocks, useRequestUnlock, activeLocksForProperty } from "@/hooks/useLocks";
import { Block } from "@/components/common/Block";
import { StatusPill } from "@/components/common/StatusPill";
import { LockSheet } from "./LockSheet";
import { SellSheet } from "./SellSheet";

function LockRow({ lock, onUnlock, unlockPending }: {
  lock: import("@/types/lock").ShareLock;
  onUnlock: (id: string) => void;
  unlockPending: boolean;
}) {
  const matures = lock.maturesAt ? lock.maturesAt.slice(0, 10) : null;
  return (
    <Block className="p-4 space-y-3" data-testid={`lock-row-${lock.status}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Lock size={16} strokeWidth={1.75} className="shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground tnum">
            {lock.shares} shares
          </span>
        </div>
        {lock.status === "locked" ? (
          <StatusPill label={lock.payoutPeriod === "weekly" ? "Accruing · weekly" : "Accruing · monthly"} variant="success" />
        ) : (
          <StatusPill label={`Unlocks ${matures ?? "2–3 days"}`} variant="warning" />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
        <div>
          <div className="mb-1 text-[0.6875rem] leading-snug text-muted-foreground">Accrued unpaid</div>
          <div className="text-sm font-semibold tnum text-success">{usd(lock.accruedUnpaidUsd)}</div>
        </div>
        <div>
          <div className="mb-1 text-[0.6875rem] leading-snug text-muted-foreground">
            {lock.payoutPeriod === "weekly" ? "Per week" : "Per month"}
          </div>
          <div className="text-sm font-semibold tnum text-foreground">{usd(lock.installmentUsd)}</div>
        </div>
      </div>
      {lock.status === "locked" ? (
        <button
          type="button"
          disabled={unlockPending}
          onClick={() => {
            haptics.impact("light");
            onUnlock(lock.id);
          }}
          className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-transparent text-sm font-semibold text-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
        >
          <LockOpen size={16} strokeWidth={1.75} />
          {unlockPending ? "Requesting…" : "Request unlock"}
        </button>
      ) : (
        <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
          Yield stopped at your unlock request. Shares become sellable in 2–3 days.
        </p>
      )}
    </Block>
  );
}

export function YieldLockSection({ listing }: { listing: Listing }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const portfolio = usePortfolio();
  const locksQuery = useLocks();
  const unlock = useRequestUnlock();

  const holding = portfolio.data?.holdings.find((h) => h.propertyId === listing.id);
  const activeLocks = activeLocksForProperty(locksQuery.data?.locks, listing.id);
  const lockedShares = activeLocks.reduce((s, l) => s + l.shares, 0);
  const owned = holding?.sharesOwned ?? 0;
  const free = Math.max(0, owned - lockedShares);

  return (
    <section className="space-y-2" data-testid="yield-lock-section">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">Yield</h2>
      <Block className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium text-foreground">Monthly yield</div>
            <div className="mt-0.5 text-[0.6875rem] text-muted-foreground">
              On locked shares · weekly option pays rate − 1%
            </div>
          </div>
          <span className="rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-white tnum">
            {listing.monthlyYieldRate.toFixed(2)}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
          <div>
            <div className="mb-1 text-[0.6875rem] leading-snug text-muted-foreground">Your shares</div>
            <div className="text-sm font-semibold tnum text-foreground">{owned}</div>
          </div>
          <div>
            <div className="mb-1 text-[0.6875rem] leading-snug text-muted-foreground">Free to lock</div>
            <div className="text-sm font-semibold tnum text-foreground">{free}</div>
          </div>
        </div>

        {owned === 0 ? (
          <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
            Buy shares first, then lock them to start earning from day one.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={free === 0}
              onClick={() => {
                haptics.impact("light");
                setSheetOpen(true);
              }}
              className="flex h-[44px] items-center justify-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
              data-testid="open-lock-sheet"
            >
              <Lock size={16} strokeWidth={1.75} />
              {free === 0 ? "All locked" : "Lock"}
            </button>
            <button
              type="button"
              onClick={() => {
                haptics.impact("light");
                setSellOpen(true);
              }}
              className="flex h-[44px] items-center justify-center gap-2 rounded-[10px] border border-border bg-transparent px-4 text-sm font-semibold text-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out"
              data-testid="open-sell-sheet"
            >
              <TrendingDown size={16} strokeWidth={1.75} />
              Sell
            </button>
          </div>
        )}
      </Block>

      {activeLocks.map((lock) => (
        <LockRow
          key={lock.id}
          lock={lock}
          onUnlock={(id) => unlock.mutate(id)}
          unlockPending={unlock.isPending && unlock.variables === lock.id}
        />
      ))}

      <LockSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        listing={listing}
        freeShares={free}
        avgCostUsd={holding?.avgCostUsd ?? listing.sharePriceUsd}
      />
      <SellSheet
        open={sellOpen}
        onClose={() => setSellOpen(false)}
        listing={listing}
        freeShares={free}
        avgCostUsd={holding?.avgCostUsd ?? listing.sharePriceUsd}
      />
    </section>
  );
}

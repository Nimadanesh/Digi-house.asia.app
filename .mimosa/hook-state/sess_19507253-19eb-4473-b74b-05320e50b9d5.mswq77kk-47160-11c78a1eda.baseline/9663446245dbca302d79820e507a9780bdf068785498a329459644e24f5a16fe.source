"use client";
// File responsibility: Yield & lock section on Property detail (PRODUCT-PLAN §0.4 / PB-08).
// Shows the property's monthly yield rate, the user's locked/free position, and the
// lock sheet (period selector + shares stepper + monthly↔weekly comparison).
// Copy style follows the existing buy-flow convention (English strings, like BuyQtyStep).
import { useState } from "react";
import { Lock, LockOpen, Minus, Plus, TrendingDown } from "lucide-react";
import type { Listing } from "@/types/property";
import type { PayoutPeriod, ShareLock } from "@/types/lock";
import { usd } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { usePortfolio, useLocks, useCreateLock, useRequestUnlock, activeLocksForProperty } from "@/hooks";
import { installmentUsd } from "@/lib/yield-math";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { Sheet } from "@/components/common/Sheet";
import { StatusPill } from "@/components/common/StatusPill";
import { SellSheet } from "./SellSheet";

const PERIODS: Array<{ value: PayoutPeriod; label: string; hint: string }> = [
  { value: "monthly", label: "Monthly", hint: "full rate, 1 payout / month" },
  { value: "weekly", label: "Weekly", hint: "rate − 1%, 4 payouts / month" },
];

function LockRow({ lock, onUnlock, unlockPending }: {
  lock: ShareLock;
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

function LockSheet({
  open,
  onClose,
  listing,
  freeShares,
  avgCostUsd,
}: {
  open: boolean;
  onClose: () => void;
  listing: Listing;
  freeShares: number;
  avgCostUsd: number;
}) {
  const [shares, setShares] = useState(1);
  const [period, setPeriod] = useState<PayoutPeriod>("monthly");
  const create = useCreateLock();

  const max = Math.max(1, freeShares);
  const principal = shares * avgCostUsd;
  const monthly = installmentUsd(principal, listing.monthlyYieldRate, "monthly");
  const weekly = installmentUsd(principal, listing.monthlyYieldRate, "weekly");
  const invalid = shares < 1 || shares > freeShares;

  function submit() {
    create.mutate(
      { propertyId: listing.id, shares, payoutPeriod: period },
      { onSuccess: onClose },
    );
  }

  return (
    <Sheet open={open} onClose={onClose} labelledBy="lock-sheet-title">
      <div className="space-y-4 pb-2" data-testid="lock-sheet">
        <h2 id="lock-sheet-title" className="text-[1.0625rem] font-semibold text-foreground">
          Lock shares
        </h2>

        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Payout period">
          {PERIODS.map((opt) => {
            const selected = period === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={selected}
                aria-label={`Payout ${opt.label}`}
                onClick={() => {
                  haptics.selection();
                  setPeriod(opt.value);
                }}
                className={`min-h-[44px] rounded-[12px] text-sm font-semibold transition-colors duration-[120ms] ease-out ${
                  selected
                    ? "bg-primary/15 text-primary"
                    : "bg-surface-2 text-muted-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
          {PERIODS.find((p) => p.value === period)!.hint}
        </p>

        <Block>
          <Row className="!min-h-[48px]">
            <span className="text-sm text-muted-foreground">Free shares</span>
            <span className="ml-auto text-sm tnum font-semibold text-foreground">{freeShares}</span>
          </Row>
          <Row className="!min-h-[48px]">
            <span className="text-sm text-muted-foreground">Monthly rate</span>
            <span className="ml-auto text-sm tnum font-semibold text-success">
              {listing.monthlyYieldRate.toFixed(2)}%
            </span>
          </Row>
        </Block>

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={shares <= 1}
            onClick={() => {
              haptics.selection();
              setShares((q) => Math.max(1, q - 1));
            }}
            className="size-12 rounded-[12px] bg-surface-2 flex items-center justify-center active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
          >
            <Minus size={22} strokeWidth={1.75} />
          </button>
          <div className="min-w-[88px] text-center text-3xl font-semibold tnum" data-testid="lock-qty">
            {shares}
          </div>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={shares >= max}
            onClick={() => {
              haptics.selection();
              setShares((q) => Math.min(max, q + 1));
            }}
            className="size-12 rounded-[12px] bg-surface-2 flex items-center justify-center active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
          >
            <Plus size={22} strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              haptics.selection();
              setShares(max);
            }}
            className="min-h-[44px] min-w-[52px] rounded-full bg-primary/15 px-3 text-sm font-semibold text-primary active:scale-[0.97] transition-transform duration-[120ms] ease-out"
          >
            Max
          </button>
        </div>
        {invalid ? (
          <p className="text-xs text-danger text-center" role="alert">
            Quantity must be between 1 and {freeShares}.
          </p>
        ) : null}

        <div className="rounded-[12px] bg-surface-2 p-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Locked principal</span>
            <span className="tnum font-semibold text-foreground" data-testid="lock-principal">
              {usd(principal)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monthly payout</span>
            <span className="tnum font-medium text-success" data-testid="lock-monthly">
              {usd(monthly)} / month
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Weekly payout</span>
            <span className="tnum font-medium text-success" data-testid="lock-weekly">
              {usd(weekly)} × 4 / month
            </span>
          </div>
        </div>

        {create.isError ? (
          <p className="text-xs text-danger text-center" role="alert">
            {(create.error as Error).message}
          </p>
        ) : null}

        <button
          type="button"
          disabled={invalid || create.isPending}
          onClick={submit}
          className="h-[52px] w-full rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-40"
          data-testid="lock-confirm"
        >
          {create.isPending ? "Locking…" : "Lock & earn"}
        </button>
        <p className="text-[0.6875rem] text-center text-muted-foreground">
          Locked shares can&apos;t be sold. Unlock takes 2–3 days and stops yield.
        </p>
      </div>
    </Sheet>
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

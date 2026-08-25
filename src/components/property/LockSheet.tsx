"use client";
// File responsibility: Lock confirmation bottom sheet — payout period selector, shares
// stepper, principal/payout preview, confirm. Yield math stays in lib/yield-math
// (installmentUsd); creation goes through useCreateLock (PRODUCT-PLAN §0.4).
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { Listing } from "@/types/property";
import type { PayoutPeriod } from "@/types/lock";
import { usd } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { useCreateLock } from "@/hooks/useLocks";
import { installmentUsd } from "@/lib/yield-math";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { Sheet } from "@/components/common/Sheet";

const PERIODS: Array<{ value: PayoutPeriod; label: string; hint: string }> = [
  { value: "monthly", label: "Monthly", hint: "full rate, 1 payout / month" },
  { value: "weekly", label: "Weekly", hint: "rate − 1%, 4 payouts / month" },
];

export function LockSheet({
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
        <p className="text-sm leading-relaxed text-muted-foreground">
          Locked shares start earning yield from day 1. Choose how often you get paid.
        </p>

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
          {create.isPending ? "Locking…" : `Lock ${shares} ${shares === 1 ? "share" : "shares"} & earn`}
        </button>
        <p className="text-[0.6875rem] text-center text-muted-foreground">
          Locked shares can&apos;t be sold. Unlock takes 2–3 days and stops yield.
        </p>
      </div>
    </Sheet>
  );
}

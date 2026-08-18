"use client";
// File responsibility: Settings — request a USDT withdrawal (PE-08). Bottom sheet
// with the withdrawable balance, a whole-dollar amount input, Max, and the
// useRequestWithdrawal mutation. Copy follows the buy/sell-sheet convention
// (English strings, like SellSheet). Requires a saved withdrawal address (PE-01).
import { useState } from "react";
import { Sheet } from "@/components/common/Sheet";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { shortAddr, usd } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { useMeSummary } from "@/hooks/useLocks";
import { useRequestWithdrawal } from "@/hooks/useWithdrawals";
import { useAuthStore } from "@/stores/auth.store";

export function WithdrawalRequestSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} labelledBy="withdrawal-request-title">
      {open ? <WithdrawalRequestContent onClose={onClose} /> : null}
    </Sheet>
  );
}

/** Deferred into the open sheet so the data hooks only run while mounted (G10). */
function WithdrawalRequestContent({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const { data: summary } = useMeSummary();
  const request = useRequestWithdrawal();
  const [dollars, setDollars] = useState(0);

  const withdrawable = summary?.balances.withdrawableUsd ?? 0;
  const hasAddress = Boolean(user?.withdrawalAddress);

  const amountUsd = dollars * 100;
  const invalid =
    !Number.isInteger(dollars) || dollars < 1 || amountUsd > withdrawable;

  function submit() {
    if (invalid || !hasAddress) return;
    request.mutate(
      { amountUsd },
      { onSuccess: onClose },
    );
  }

  const pending = request.isPending;
  const error = request.error as Error | null;

  return (
    <div className="space-y-4 pb-2" data-testid="withdrawal-request-sheet">
        <h2
          id="withdrawal-request-title"
          className="text-[1.0625rem] font-semibold leading-snug text-foreground"
        >
          Request withdrawal
        </h2>

        <Block>
          <Row className="!min-h-[48px]">
            <span className="text-sm text-muted-foreground">Withdrawable</span>
            <span className="ml-auto text-sm tnum font-semibold text-foreground">
              {usd(withdrawable)}
            </span>
          </Row>
          <Row className="!min-h-[48px]">
            <span className="text-sm text-muted-foreground">Payout address</span>
            <span className="ml-auto max-w-[55%] truncate text-sm font-mono tnum text-muted-foreground">
              {hasAddress
                ? shortAddr(user!.withdrawalAddress!, { prefix: 6, suffix: 6 })
                : "Not set"}
            </span>
          </Row>
        </Block>

        <div className="space-y-2">
          <label htmlFor="withdrawal-amount" className="text-sm text-muted-foreground">
            Amount (USDT)
          </label>
          <div className="flex items-center gap-2 rounded-[12px] bg-surface-2 px-3">
            <span className="text-sm font-semibold text-muted-foreground">$</span>
            <input
              id="withdrawal-amount"
              type="number"
              min={1}
              step={1}
              value={dollars || ""}
              onChange={(e) => setDollars(Number(e.target.value) || 0)}
              className="min-h-[48px] w-full bg-transparent text-lg font-semibold tnum text-foreground outline-none"
              data-testid="withdrawal-request-amount"
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            disabled={withdrawable <= 0}
            onClick={() => {
              haptics.selection();
              setDollars(Math.floor(withdrawable / 100));
            }}
            className="min-h-[44px] min-w-[52px] rounded-full bg-primary/15 px-3 text-sm font-semibold text-primary active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
            data-testid="withdrawal-request-max"
          >
            Max
          </button>
        </div>

        {!hasAddress ? (
          <p className="text-xs text-danger text-center" role="alert">
            Set a USDT withdrawal address first.
          </p>
        ) : invalid ? (
          <p className="text-xs text-danger text-center" role="alert">
            {dollars < 1
              ? "Enter an amount."
              : `Maximum withdrawable is ${usd(withdrawable)}.`}
          </p>
        ) : null}

        <button
          type="button"
          disabled={invalid || !hasAddress || pending}
          onClick={submit}
          className="h-[52px] w-full rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-40"
          data-testid="withdrawal-request-submit"
        >
          {pending
            ? "Requesting…"
            : invalid
              ? "Request withdrawal"
              : `Request withdrawal · ${usd(amountUsd)}`}
        </button>

        {error ? (
          <p className="text-xs text-danger text-center" role="alert">
            {error.message}
          </p>
        ) : null}
      </div>
  );
}

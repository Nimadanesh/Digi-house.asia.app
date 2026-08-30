"use client";
// File responsibility: Settings — request a USDT withdrawal (PE-08). Two-step flow:
// amount → review (fee 1%, net, 4 weekly installments, destination) → confirm →
// completion state. Fee/net preview reuses planWithdrawal — a mirror of the API's
// withdrawal-math (locked model); the server always computes the actual charge.
// Copy follows the buy/sell-sheet convention (English strings, like SellSheet).
import { useState } from "react";
import { Check } from "lucide-react";
import { Sheet } from "@/components/common/Sheet";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { shortAddr, usd } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { useMeSummary } from "@/hooks/useLocks";
import { useRequestWithdrawal } from "@/hooks/useWithdrawals";
import { planWithdrawal } from "@/lib/mock/withdrawals";
import { useAuthStore } from "@/stores/auth.store";

export function WithdrawalRequestSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} labelledBy="withdrawal-request-title" dismissible>
      {open ? <WithdrawalRequestContent onClose={onClose} /> : null}
    </Sheet>
  );
}

type Step = "form" | "review" | "success";

/** Deferred into the open sheet so the data hooks only run while mounted (G10). */
function WithdrawalRequestContent({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const { data: summary } = useMeSummary();
  const request = useRequestWithdrawal();
  const [dollars, setDollars] = useState(0);
  const [step, setStep] = useState<Step>("form");
  // Flow state initializes fresh on each open — content mounts only while the sheet
  // is open (G10), so there is no stale review/success state across opens.

  const withdrawable = summary?.balances.withdrawableUsd ?? 0;
  const hasAddress = Boolean(user?.withdrawalAddress);

  const amountUsd = dollars * 100;
  const invalid =
    !Number.isInteger(dollars) || dollars < 1 || amountUsd > withdrawable;

  // Mirror of the API withdrawal-math (locked model): 1% fee, net in 4 weekly installments.
  const { feeUsd, netUsd } = planWithdrawal(amountUsd);

  function submit() {
    if (invalid || !hasAddress) return;
    haptics.impact("medium");
    request.mutate(
      { amountUsd },
      { onSuccess: () => setStep("success") },
    );
  }

  const pending = request.isPending;
  const error = request.error as Error | null;

  return (
    <div className="space-y-4 pb-2" data-testid="withdrawal-request-sheet">
      {step === "success" ? (
        <div className="space-y-4 pb-3 text-center" data-testid="withdrawal-request-success">
          <div
            className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15"
            style={{ animation: "dh-fade-in 160ms ease-out" }}
          >
            <Check size={28} strokeWidth={2.25} className="text-success" aria-hidden />
          </div>
          <div className="space-y-1.5">
            <h2
              id="withdrawal-request-title"
              className="text-[1.0625rem] font-semibold leading-snug text-foreground"
            >
              Withdrawal requested
            </h2>
            <p className="text-sm leading-relaxed text-foreground tnum">
              {usd(amountUsd)} · {usd(netUsd)} after the 1% fee
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Arrives in 4 weekly installments. Track it in Settings → Withdrawal requests.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="withdrawal-request-done"
            className="h-[48px] w-full rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out"
          >
            Done
          </button>
        </div>
      ) : step === "review" ? (
        <>
          <h2
            id="withdrawal-request-title"
            className="text-[1.0625rem] font-semibold leading-snug text-foreground"
          >
            Confirm withdrawal
          </h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Withdraw anytime — 1% fee, paid in 4 weekly installments.
          </p>

          <Block>
            <Row className="!min-h-[48px]">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="ml-auto text-sm tnum font-semibold text-foreground">
                {usd(amountUsd)}
              </span>
            </Row>
            <Row className="!min-h-[48px]">
              <span className="text-sm text-muted-foreground">Fee (1%)</span>
              <span className="ml-auto text-sm tnum font-medium text-danger">−{usd(feeUsd)}</span>
            </Row>
            <Row className="!min-h-[48px]">
              <span className="text-sm font-medium text-foreground">You receive</span>
              <span className="ml-auto text-sm tnum font-semibold text-success">{usd(netUsd)}</span>
            </Row>
            <Row className="!min-h-[48px]">
              <span className="text-sm text-muted-foreground">Paid in</span>
              <span className="ml-auto text-sm tnum font-medium text-foreground">
                4 weekly installments
              </span>
            </Row>
            <Row className="!min-h-[48px]">
              <span className="text-sm text-muted-foreground">Payout address</span>
              <span className="ml-auto max-w-[55%] truncate text-sm font-mono tnum text-muted-foreground">
                {shortAddr(user!.withdrawalAddress!, { prefix: 6, suffix: 6 })}
              </span>
            </Row>
          </Block>

          {error ? (
            <p className="text-xs text-danger text-center" role="alert" data-testid="withdrawal-request-error">
              {error.message}
            </p>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                haptics.selection();
                setStep("form");
              }}
              className="h-[52px] flex-1 rounded-[12px] bg-surface-2 text-sm font-medium text-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-40"
              data-testid="withdrawal-request-back"
            >
              Edit amount
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={submit}
              className="h-[52px] flex-1 rounded-[12px] bg-primary text-sm font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-40"
              data-testid="withdrawal-request-confirm"
            >
              {pending ? "Submitting withdrawal…" : "Confirm withdrawal"}
            </button>
          </div>
        </>
      ) : (
        <>
          <h2
            id="withdrawal-request-title"
            className="text-[1.0625rem] font-semibold leading-snug text-foreground"
          >
            Request withdrawal
          </h2>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Withdraw anytime — 1% fee, paid in 4 weekly installments.
          </p>

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
            onClick={() => {
              haptics.impact("light");
              setStep("review");
            }}
            className="h-[52px] w-full rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-40"
            data-testid="withdrawal-request-submit"
          >
            Review withdrawal
          </button>

          {error ? (
            <p className="text-xs text-danger text-center" role="alert">
              {error.message}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

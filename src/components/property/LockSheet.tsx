"use client";
// File responsibility: Lock confirmation bottom sheet — payout period selector, shares
// stepper, principal/payout preview, confirm, and a completion state (no silent close).
// Yield math stays in lib/yield-math (installmentUsd); creation goes through
// useCreateLock (PRODUCT-PLAN §0.4).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Minus, Plus } from "lucide-react";
import type { Listing } from "@/types/property";
import type { PayoutPeriod } from "@/types/lock";
import { usd } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { useCreateLock } from "@/hooks/useLocks";
import { installmentUsd } from "@/lib/yield-math";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { Sheet } from "@/components/common/Sheet";

const PERIODS: Array<{ value: PayoutPeriod; labelKey: string; hintKey: string }> = [
  { value: "monthly", labelKey: "payoutPeriodMonthly", hintKey: "payoutPeriodMonthlyHint" },
  { value: "weekly", labelKey: "payoutPeriodWeekly", hintKey: "payoutPeriodWeeklyHint" },
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
  const t = useTranslations("property");
  const [shares, setShares] = useState(1);
  const [period, setPeriod] = useState<PayoutPeriod>("monthly");
  /** Completion state — the sheet shows the new earning state instead of closing silently. */
  const [locked, setLocked] = useState<{ shares: number; period: PayoutPeriod; installmentUsdCents: number } | null>(null);
  const create = useCreateLock();

  const max = Math.max(1, freeShares);
  const principal = shares * avgCostUsd;
  const monthly = installmentUsd(principal, listing.monthlyYieldRate, "monthly");
  const weekly = installmentUsd(principal, listing.monthlyYieldRate, "weekly");
  const invalid = shares < 1 || shares > freeShares;

  function submit() {
    if (invalid || create.isPending) return;
    create.mutate(
      { propertyId: listing.id, shares, payoutPeriod: period },
      {
        onSuccess: () =>
          setLocked({
            shares,
            period,
            installmentUsdCents: period === "weekly" ? weekly : monthly,
          }),
      },
    );
  }

  return (
    <Sheet open={open} onClose={onClose} labelledBy="lock-sheet-title" dismissible={!locked && !create.isPending}>
      {locked ? (
        <div className="space-y-4 pb-3 text-center" data-testid="lock-success">
          <div
            className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15"
            style={{ animation: "dh-fade-in 160ms ease-out" }}
          >
            <Check size={28} strokeWidth={2.25} className="text-success" aria-hidden />
          </div>
          <div className="space-y-1.5">
            <h2 id="lock-sheet-title" className="text-[1.0625rem] font-semibold leading-snug text-foreground">
              {t("lockedSuccessTitle")}
            </h2>
            <p className="text-sm leading-relaxed text-foreground tnum">
              {t("earningFromDay1", {
                count: locked.shares,
                unit: locked.shares === 1 ? t("shareWord") : t("sharesWord"),
              })}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground tnum">
              {usd(locked.installmentUsdCents)} {locked.period === "weekly" ? t("perWeekWord") : t("perMonthWord")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-[48px] w-full rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out"
          >
            {t("doneCta")}
          </button>
        </div>
      ) : (
      <div className="space-y-4 pb-2" data-testid="lock-sheet">
        <h2 id="lock-sheet-title" className="text-[1.0625rem] font-semibold text-foreground">
          {t("lockSheetTitle")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("lockSheetIntro")}
        </p>

        <div className="grid grid-cols-2 gap-2" role="group" aria-label={t("payoutPeriodLabel")}>
          {PERIODS.map((opt) => {
            const selected = period === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={selected}
                aria-label={t("payoutPeriodAria", { period: t(opt.labelKey) })}
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
                {t(opt.labelKey)}
              </button>
            );
          })}
        </div>
        <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
          {t(PERIODS.find((p) => p.value === period)!.hintKey)}
        </p>

        <Block>
          <Row className="!min-h-[48px]">
            <span className="text-sm text-muted-foreground">{t("freeShares")}</span>
            <span className="ml-auto text-sm tnum font-semibold text-foreground">{freeShares}</span>
          </Row>
          <Row className="!min-h-[48px]">
            <span className="text-sm text-muted-foreground">{t("monthlyRate")}</span>
            <span className="ml-auto text-sm tnum font-semibold text-success">
              {listing.monthlyYieldRate.toFixed(2)}%
            </span>
          </Row>
        </Block>

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label={t("decreaseQty")}
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
            aria-label={t("increaseQty")}
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
            {t("maxCta")}
          </button>
        </div>
        {invalid ? (
          <p className="text-xs text-danger text-center" role="alert">
            {t("quantityInvalid", { max: freeShares })}
          </p>
        ) : null}

        <div className="rounded-[12px] bg-surface-2 p-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("lockedPrincipal")}</span>
            <span className="tnum font-semibold text-foreground" data-testid="lock-principal">
              {usd(principal)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("monthlyPayout")}</span>
            <span className="tnum font-medium text-success" data-testid="lock-monthly">
              {usd(monthly)} {t("perMonthWord")}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("weeklyPayout")}</span>
            <span className="tnum font-medium text-success" data-testid="lock-weekly">
              {usd(weekly)} {t("timesFourMonth")}
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
          {create.isPending
            ? t("lockingPending")
            : t("lockConfirmCta", {
                count: shares,
                unit: shares === 1 ? t("shareWord") : t("sharesWord"),
              })}
        </button>
        <p className="text-[0.6875rem] text-center text-muted-foreground">
          {t("lockWarningNote")}
        </p>
      </div>
      )}
    </Sheet>
  );
}

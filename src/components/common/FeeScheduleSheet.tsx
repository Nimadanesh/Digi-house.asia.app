"use client";
// File responsibility: commission bottom sheet (PRODUCT-PLAN §0.5) — the 9-tier schedule
// as a markdown-style table: distinct header row, separated columns, compact $K/$M amounts,
// sticky amount column, horizontal scroll for the fee columns. Flat 7% instant-sell rule below.
import { useTranslations } from "next-intl";
import type { FeeTier } from "@/types/fees";
import { bpsToPct, SELL_INSTANT_BPS } from "@/types/fees";
import { usdCompact } from "@/lib/format";
import { Sheet } from "@/components/common/Sheet";
import { useFees } from "@/hooks/useFees";

const GRID = "grid grid-cols-[150px_1fr_1fr_1fr]";

function rangeLabel(tier: FeeTier): string {
  return tier.maxAmountUsd == null
    ? `≥ ${usdCompact(tier.minAmountUsd)}`
    : `${usdCompact(tier.minAmountUsd)} – ${usdCompact(tier.maxAmountUsd)}`;
}

function HeaderCell({ label, first = false }: { label: string; first?: boolean }) {
  return (
    <span
      className={`px-3 py-2 text-[0.625rem] font-semibold uppercase leading-tight tracking-wide text-muted-foreground ${
        first
          ? "sticky start-0 z-[2] bg-surface-2"
          : "border-s border-border"
      }`}
    >
      {label}
    </span>
  );
}

function TierRow({ tier }: { tier: FeeTier }) {
  return (
    <div className={`${GRID} border-t border-border`} data-testid="fee-tier-row">
      <span className="sticky start-0 z-[1] bg-card px-3 py-2.5 text-sm tnum font-medium text-foreground" data-testid="fee-tier-range">
        {rangeLabel(tier)}
      </span>
      <span className="border-s border-border px-3 py-2.5 text-sm tnum text-foreground">
        {bpsToPct(tier.buyPrimaryBps)}
      </span>
      <span className="border-s border-border px-3 py-2.5 text-sm tnum text-foreground">
        {bpsToPct(tier.buySecondaryBps)}
      </span>
      <span className="border-s border-border px-3 py-2.5 text-sm tnum text-foreground">
        {bpsToPct(tier.sellSecondaryBps)}
      </span>
    </div>
  );
}

/**
 * The fetch lives in a child mounted only while the sheet is open — cards can
 * therefore embed FeeInfoButton without a QueryClient until the user opens it.
 */
function FeesContent() {
  const t = useTranslations("marketplace");
  const fees = useFees();

  return (
    <div className="space-y-4 pb-2" data-testid="fee-schedule-sheet">
      <div className="space-y-1.5">
        <h2 id="fees-sheet-title" className="text-[1.0625rem] font-semibold text-foreground">
          {t("feesTitle")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("feesPerTx")}
        </p>
      </div>

      <div className="-mx-4 overflow-x-auto overscroll-x-contain" data-testid="fee-tier-scroller">
        <div className="min-w-[560px] rounded-[12px] border border-border bg-card" data-testid="fee-tier-list">
          <div className={`${GRID} bg-surface-2 rounded-t-[12px]`}>
            <HeaderCell label={t("feesRange")} first />
            <HeaderCell label={t("feesBuyPrimary")} />
            <HeaderCell label={t("feesBuyMarket")} />
            <HeaderCell label={t("feesSellMarket")} />
          </div>
          {(fees.data ?? []).map((tier) => (
            <TierRow key={tier.id} tier={tier} />
          ))}
        </div>
      </div>

      <div className="rounded-[12px] bg-surface-2 p-3 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("feesInstantSell")}</span>
          <span className="tnum font-semibold text-foreground">{bpsToPct(SELL_INSTANT_BPS)}</span>
        </div>
        <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
          {t("feesInstantNote")}
        </p>
      </div>

      <p className="text-[0.6875rem] text-center text-muted-foreground">
        {t("feesNoCap")}
      </p>
    </div>
  );
}

export function FeeScheduleSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} labelledBy="fees-sheet-title">
      <FeesContent />
    </Sheet>
  );
}

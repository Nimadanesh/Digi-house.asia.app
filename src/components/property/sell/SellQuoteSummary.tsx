"use client";
// File responsibility: live sell quote block — the financial hierarchy for a proposed
// resale (gross → cost basis → gain/loss → market fee → net + remaining position).
// Purely presentational: numbers arrive via the sell view-model (lib/sell-quote);
// formatting routes through lib/format. Gain/loss is the proposed price vs
// acquisition cost BEFORE fees — never presented as guaranteed profit.
import { useTranslations } from "next-intl";
import { usd, pct } from "@/lib/format";
import { bpsToPct } from "@/types/fees";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import type { SellQuote } from "@/lib/sell-quote";

function GainLossValue({ quote }: { quote: SellQuote }) {
  const t = useTranslations("property");
  if (quote.gainLossUsd == null || quote.direction == null) {
    return <span className="tnum font-semibold text-muted-foreground">—</span>;
  }
  if (quote.direction === "breakEven") {
    return (
      <span className="tnum font-semibold text-muted-foreground" data-testid="sell-gain-loss">
        {usd(0)} · {t("sellBreakEven")}
      </span>
    );
  }  const gain = quote.direction === "gain";
  const signed = `${gain ? "+" : "−"}${usd(Math.abs(quote.gainLossUsd))}`;
  return (
    <span
      className={`tnum font-semibold ${gain ? "text-success" : "text-danger"}`}
      data-testid="sell-gain-loss"
    >
      {signed} · {gain ? t("sellGain") : t("sellLoss")}
    </span>
  );
}

export function SellQuoteSummary({ quote }: { quote: SellQuote | null }) {
  const t = useTranslations("property");
  if (!quote) return null;
  return (
    <div className="rounded-[12px] bg-surface-2 p-4 space-y-2" data-testid="sell-quote">
      <div className="flex justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{t("orderValue")}</span>
        <span className="tnum font-semibold text-foreground text-end">{usd(quote.grossUsd)}</span>
      </div>
      <div className="flex justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{t("sellAcquisitionCost")}</span>
        <span className="tnum font-medium text-foreground text-end">
          {quote.acquisitionCostUsd == null ? "—" : usd(quote.acquisitionCostUsd)}
        </span>
      </div>
      <div className="flex justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{t("sellGainLoss")}</span>
        <GainLossValue quote={quote} />
      </div>
      <div className="flex justify-between gap-2 text-sm">
        <span className="text-muted-foreground">
          {t("marketFeeLabel")}
          {quote.feeRateBps != null ? ` (${bpsToPct(quote.feeRateBps)})` : ""}
        </span>
        <span className="tnum font-medium text-muted-foreground text-end">
          {quote.feeUsd == null ? "—" : usd(quote.feeUsd)}
        </span>
      </div>
      {/* Net hero — the answer to "how much do I receive". Foreground (not
          Paid-green): a proposed listing total, never paid income. */}
      <div className="flex justify-between gap-2 border-t border-border pt-2">
        <span className="text-[0.9375rem] font-semibold text-foreground">{t("youReceive")}</span>
        <span className="tnum text-[0.9375rem] font-bold tracking-tight text-foreground text-end">
          {quote.netProceedsUsd == null ? "—" : usd(quote.netProceedsUsd)}
        </span>
      </div>
      <div className="flex justify-between text-sm border-t border-border pt-1.5">
        <span className="text-muted-foreground">{t("sellRemainingShares")}</span>
        <span className="tnum font-semibold text-foreground" data-testid="sell-remaining">
          {quote.sharesRemaining.toLocaleString()} · {pct(quote.remainingOwnershipRatio)}
        </span>
      </div>
      {quote.feeUsd != null ? (
        <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
          {t("sellFeeChargedOnSale")}
        </p>
      ) : null}
    </div>
  );
}

export function SellPositionBlock({
  ownedShares,
  totalShares,
  avgCostUsd,
}: {
  ownedShares: number;
  totalShares: number;
  avgCostUsd: number;
}) {
  const t = useTranslations("property");
  return (
    <Block data-testid="sell-position">
      <Row>
        <span className="text-sm text-muted-foreground">{t("positionTotal")}</span>
        <span className="ml-auto text-sm tnum font-semibold text-foreground">
          {ownedShares.toLocaleString()} · {pct(totalShares > 0 ? ownedShares / totalShares : 0)}
        </span>
      </Row>
      <Row>
        <span className="text-sm text-muted-foreground">{t("sellAvgCost")}</span>
        <span className="ml-auto text-sm tnum font-semibold text-foreground">{usd(avgCostUsd)}</span>
      </Row>
    </Block>
  );
}

"use client";
// File responsibility: other investment returns on Income — the three concepts
// that are NOT rental income (plan profit, estate-value change, secondary-market
// gain/loss), each honestly sourced. No plan registry exists and no valuation
// history exists, so those rows stay non-numeric by product rule; live sell
// listings show their Slice H proposed gain (listed, never sold, never income).
// Presentational: gains arrive resolved via secondaryGains.
import { useTranslations } from "next-intl";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { Skeleton } from "@/components/common/Skeleton";
import { usd } from "@/lib/format";
import type { ListingGain } from "@/lib/income-view-model";

function GainValue({ gain }: { gain: ListingGain }) {
  const tProperty = useTranslations("property");
  if (gain.gainLossUsd == null || gain.direction === "unknown") {
    return <span className="tnum font-semibold text-muted-foreground">—</span>;
  }
  if (gain.direction === "breakEven") {
    return (
      <span className="tnum font-semibold text-muted-foreground">
        {usd(0)} · {tProperty("sellBreakEven")}
      </span>
    );
  }
  const positive = gain.direction === "gain";
  return (
    <span className={`tnum font-semibold ${positive ? "text-success" : "text-danger"}`}>
      {`${positive ? "+" : "−"}${usd(Math.abs(gain.gainLossUsd))} · ${
        positive ? tProperty("sellGain") : tProperty("sellLoss")
      }`}
    </span>
  );
}

export function OtherReturns({ gains }: { gains: ListingGain[] | undefined }) {
  const t = useTranslations("earnings");
  const tCommon = useTranslations("common");
  const tProperty = useTranslations("property");
  const tPortfolio = useTranslations("portfolio");
  if (gains === undefined) {
    return (
      <section className="space-y-2" data-testid="other-loading">
        <Block className="space-y-2 p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
        </Block>
      </section>
    );
  }
  return (
    <section className="space-y-2" data-testid="other-returns">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("otherTitle")}
      </h2>
      <Block>
        <Row data-testid="other-plan">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{t("otherPlan")}</p>
            <p className="mt-0.5 text-[0.6875rem] leading-snug text-muted-foreground">
              {t("otherPlanNone")}
            </p>
          </div>
        </Row>
        <Row data-testid="other-appreciation">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{t("otherAppreciation")}</p>
            <p className="mt-0.5 text-[0.6875rem] leading-snug text-muted-foreground">
              {t("otherAppreciationSub")}
            </p>
          </div>
          <span className="ml-auto shrink-0 text-sm tnum font-semibold text-muted-foreground">
            {tCommon("pending")}
          </span>
        </Row>
      </Block>
      <Block data-testid="other-secondary">
        <Row>
          <p className="text-sm font-medium text-foreground">{t("otherSecondary")}</p>
        </Row>
        {gains.length === 0 ? (
          <Row>
            <span className="text-sm text-muted-foreground">{t("otherSecondaryEmpty")}</span>
          </Row>
        ) : (
          gains.map((g) => (
            <Row key={g.orderId} data-testid={`other-secondary-${g.orderId}`}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{g.title}</p>
                <p className="mt-0.5 text-[0.6875rem] leading-snug text-muted-foreground tnum">
                  {g.status === "queued" ? tPortfolio("orderQueued") : tPortfolio("orderOpen")}
                  {" · "}
                  {tProperty("nShares", { count: g.quantity })}
                </p>
              </div>
              <span className="ml-auto shrink-0 text-sm">
                <GainValue gain={g} />
              </span>
            </Row>
          ))
        )}
      </Block>
    </section>
  );
}

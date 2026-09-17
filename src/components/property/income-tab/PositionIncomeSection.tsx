"use client";
// File responsibility: Income tab — Your position income (Estate Page Structure
// §5, preserved block): real accrued-unpaid from active locks (display only),
// the position-scaled PROJECTED income (only when the trading price equals the
// V1 nominal share class), and the honest pointer to global Income for the
// paid ledger. Extracted from the retired IncomeV1Story panel unchanged in
// behavior. Projected is never presented as Paid/Accrued.
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { moneySmart } from "@/lib/format";
import { getPresentedAnnualIncome } from "@/lib/economics/property-presentation";
import { Block } from "@/components/common/Block";
import { FactRow } from "@/components/common/FactRow";

export function PositionIncomeSection({
  propertyId,
  accruedUnpaidUsd = 0,
  ownedShares = 0,
  scalePosition = false,
  onViewEarnings,
}: {
  propertyId: string;
  /** Real accrued unpaid across this property's active locks (display only). */
  accruedUnpaidUsd?: number;
  ownedShares?: number;
  /**
   * Whether owned shares scale with V1 per-share (same $100 share class).
   * False → per-share shown without position scaling (no approved cross-layer
   * rule is invented). True only when the trading price equals V1 nominal.
   */
  scalePosition?: boolean;
  /** Optional route to global Income (the paid ledger lives there). */
  onViewEarnings?: () => void;
}) {
  const t = useTranslations("property");
  const annual = getPresentedAnnualIncome(propertyId);
  const scaled =
    scalePosition && ownedShares > 0 && annual.cents != null
      ? { cents: annual.cents * ownedShares, currency: annual.currency }
      : null;
  return (
    <section className="space-y-2" data-testid="income-position">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("incomeV1Position")}
      </h2>
      <Block className="rounded-[12px] p-5 shadow-sm ring-1 ring-border/50" data-testid="income-position-card">
        <FactRow
          label={t("incomeV1Accrued")}
          value={usd(accruedUnpaidUsd)}
          valueTestId="income-position-accrued"
          caption={t("incomeV1PaidNote")}
        />
        {scaled ? (
          <FactRow
            label={`${t("ownershipV1Projected")} (${ownedShares})`}
            value={`${moneySmart(scaled.cents, scaled.currency)} ${t("incomeV1PerYear")}`}
            valueTestId="income-position-projected"
            provenance="projected"
          />
        ) : null}
        {onViewEarnings ? (
          <button
            type="button"
            onClick={onViewEarnings}
            className="mt-1 inline-flex min-h-[44px] items-center text-sm font-medium tracking-[-0.01em] text-primary transition-colors duration-200 ease-out hover:text-primary/80"
            data-testid="income-position-view-earnings"
          >
            {t("incomeV1ViewEarnings")}
          </button>
        ) : null}
      </Block>
    </section>
  );
}

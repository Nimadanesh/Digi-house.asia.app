"use client";
// File responsibility: Ownership tab §3 — Exit & Liquidity (Estate Page
// Structure §6.3), visually prominent: sell anytime (no lock-up), the locked
// 1% withdrawal fee paid in 4 weekly installments, and the villa's market
// status. LOCKED COPY ONLY — no fee/lock-up term is invented here and no
// secondary-market roadmap claim is made (D9 removed from this wave). Shares
// locked in the yield program are not sellable until unlocked — the copy
// below never claims otherwise. No settlement/fee logic lives here.
import { useTranslations } from "next-intl";
import { Block } from "@/components/common/Block";
import { FactRow } from "@/components/common/FactRow";

export function ExitLiquiditySection() {
  const t = useTranslations("property");
  return (
    <section className="space-y-2" data-testid="ownership-exit">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("exitLiquidityTitle")}
      </h2>
      <Block className="p-4" data-testid="ownership-exit-card">
        <FactRow
          label={t("exitSellAnytimeLabel")}
          value={t("exitSellAnytimeValue")}
          valueTestId="ownership-exit-sell-anytime"
        />
        <FactRow
          label={t("exitWithdrawalFeeLabel")}
          value={t("exitWithdrawalFeeValue")}
          valueTestId="ownership-exit-withdrawal"
        />
      </Block>
    </section>
  );
}

"use client";
// File responsibility: Home Details sheet — display-only rows bound to fields Home's
// hooks already expose (estate value, total invested, pending distribution, wallet).
// No math, no lock/sell/withdraw calls. Locked/free is not on PortfolioSummary and
// free/unlocked is unknown on Home, so those rows (incl. "Lock to earn") stay hidden.
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { useTonConnect } from "@/hooks/useTonConnect";
import { Sheet } from "@/components/common/Sheet";
import { Block } from "@/components/common/Block";
import type { PortfolioSummary } from "@/types/position";

export function HomeDetailsSheet({
  open,
  onClose,
  summary,
  hasNextDistribution,
  projectedNextUsd,
}: {
  open: boolean;
  onClose: () => void;
  summary: PortfolioSummary;
  hasNextDistribution: boolean;
  projectedNextUsd: number;
}) {
  const t = useTranslations("home");
  const tSettings = useTranslations("settings");
  const tCommon = useTranslations("common");
  const { connected } = useTonConnect();

  return (
    <Sheet open={open} onClose={onClose} labelledBy="home-details-title">
      <div className="space-y-3 pb-3" data-testid="home-details-sheet">
        <h2
          id="home-details-title"
          className="text-[1.0625rem] font-semibold leading-snug text-foreground"
        >
          {t("details")}
        </h2>
        <Block className="px-4 py-1">
          <div className="flex min-h-[52px] items-center justify-between gap-3 py-2.5">
            <span className="text-sm text-muted-foreground">{t("currentValue")}</span>
            <span className="text-sm font-semibold tnum text-foreground" data-testid="details-value">
              {usd(summary.totalValueUsd)}
            </span>
          </div>
          <div className="flex min-h-[52px] items-center justify-between gap-3 border-t border-border py-2.5">
            <span className="text-sm text-muted-foreground">{t("totalInvested")}</span>
            <span className="text-sm font-semibold tnum text-foreground" data-testid="details-invested">
              {usd(summary.totalInvestedUsd)}
            </span>
          </div>
          {hasNextDistribution ? (
            <div className="flex min-h-[52px] items-center justify-between gap-3 border-t border-border py-2.5">
              <span className="text-sm text-muted-foreground">{t("nextDistribution")}</span>
              <span className="text-sm font-semibold tnum text-foreground" data-testid="details-next">
                {usd(projectedNextUsd)} · {t("statusExpected")}
              </span>
            </div>
          ) : null}
          <div className="flex min-h-[52px] items-center justify-between gap-3 border-t border-border py-2.5">
            <span className="text-sm text-muted-foreground">{tSettings("wallet")}</span>
            <span className="text-sm font-medium text-foreground" data-testid="details-wallet">
              {connected ? tCommon("walletConnected") : tCommon("connectWallet")}
            </span>
          </div>
        </Block>
      </div>
    </Sheet>
  );
}

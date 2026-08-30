"use client";
// File responsibility: Secondary position card (REDESIGN-SPEC §9 "Your Position") —
// total / locked / free shares, accrued unpaid earnings, estimated value at the
// current market price, and Lock/Sell actions routed through the EXISTING
// LockSheet/SellSheet flows (no new financial logic). Hidden while the user owns
// nothing. Sheets mount only while open (G10) so their hooks initialize fresh.
import { useState } from "react";
import { Lock, TrendingDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Listing } from "@/types/property";
import { usd } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { LockSheet } from "./LockSheet";
import { SellSheet } from "./SellSheet";

export function PositionCard({
  listing,
  ownedShares,
  lockedShares,
  accruedUnpaidUsd,
  avgCostUsd,
  currentPriceUsd,
}: {
  listing: Listing;
  ownedShares: number;
  lockedShares: number;
  /** Accrued unpaid yield across this property's active locks (display only). */
  accruedUnpaidUsd: number;
  /** Holder's average cost, for the lock principal preview. */
  avgCostUsd?: number;
  /** Single source of truth (lib/property-price) for the estimated value. */
  currentPriceUsd: number;
}) {
  const t = useTranslations("property");
  const [lockOpen, setLockOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const freeShares = Math.max(0, ownedShares - lockedShares);

  // State 1 (owns nothing) or still resolving → no card; the page stays buy-focused.
  if (ownedShares <= 0) return null;

  const estimatedValue = ownedShares * currentPriceUsd;

  return (
    <>
      <section className="space-y-2" data-testid="position-card">
        <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
          {t("positionTitle")}
        </h2>
        <Block>
          <Row>
            <span className="text-sm text-muted-foreground">{t("positionTotal")}</span>
            <span
              className="ml-auto text-sm tnum font-semibold text-foreground"
              data-testid="position-total"
            >
              {ownedShares.toLocaleString()}
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("positionLocked")}</span>
            <span
              className="ml-auto text-sm tnum font-semibold text-foreground"
              data-testid="position-locked"
            >
              {lockedShares.toLocaleString()}
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("positionFree")}</span>
            <span
              className="ml-auto text-sm tnum font-semibold text-foreground"
              data-testid="position-free"
            >
              {freeShares.toLocaleString()}
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("positionAccrued")}</span>
            <span
              className="ml-auto text-sm tnum font-semibold text-success"
              data-testid="position-accrued"
            >
              {usd(accruedUnpaidUsd)}
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("positionValue")}</span>
            <span
              className="ml-auto text-sm tnum font-semibold text-foreground"
              data-testid="position-value"
            >
              {usd(estimatedValue)}
            </span>
          </Row>
        </Block>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={freeShares === 0}
            onClick={() => {
              haptics.impact("light");
              setLockOpen(true);
            }}
            className="flex h-[44px] items-center justify-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
            data-testid="position-lock"
          >
            <Lock size={16} strokeWidth={1.75} />
            {t("positionLock")}
          </button>
          <button
            type="button"
            disabled={freeShares === 0}
            onClick={() => {
              haptics.impact("light");
              setSellOpen(true);
            }}
            className="flex h-[44px] items-center justify-center gap-2 rounded-[10px] border border-border bg-transparent px-4 text-sm font-semibold text-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
            data-testid="position-sell"
          >
            <TrendingDown size={16} strokeWidth={1.75} />
            {t("positionSell")}
          </button>
        </div>
      </section>

      {/* Sheets mount only while open (G10) — their hooks/state initialize fresh. */}
      {lockOpen ? (
        <LockSheet
          open
          onClose={() => setLockOpen(false)}
          listing={listing}
          freeShares={freeShares}
          avgCostUsd={avgCostUsd ?? listing.sharePriceUsd}
        />
      ) : null}
      {sellOpen ? (
        <SellSheet
          open
          onClose={() => setSellOpen(false)}
          listing={listing}
          freeShares={freeShares}
          avgCostUsd={avgCostUsd ?? listing.sharePriceUsd}
        />
      ) : null}
    </>
  );
}

// File responsibility: Ownership tab decision support (PROMPT 05) — what owning
// THIS estate means: V1 nominal share price ($100), V1 total shares, what one
// share represents, the user's position-projected income (clearly Projected),
// genuine primary supply where relevant, ownership consequences (no guarantees,
// no implied liquidity), and the Buy entry into the existing Slice G/H flow.
// Sell entries stay in the existing position flows (PositionCard/SellSheet) —
// this panel never reimplements quote/settlement/matching/TON logic. Simulated
// holder analytics are never rendered here (honest pending note instead).
"use client";
import { useTranslations } from "next-intl";
import { eur, usd } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import type { FinancialModelV1PropertyModel } from "@/types/financial-model-v1";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { ProvenanceInfo } from "@/components/common/ProvenanceInfo";

function money(cents: number, currency: "USD" | "EUR"): string {
  return currency === "EUR" ? eur(cents) : usd(cents);
}

/** Nominal V1 share price in minor units ($100). */
export const V1_NOMINAL_SHARE_PRICE_CENTS = 10_000;

export function OwnershipV1Panel({
  v1,
  ownedShares = 0,
  sharesRemaining = 0,
  isPrimary = false,
  scalePosition = false,
  onBuy,
}: {
  /** V1 model for this estate; null only without a V1 input (never legacy). */
  v1: FinancialModelV1PropertyModel | null;
  ownedShares?: number;
  /** Genuine primary supply (trading param); shown only when primary + available. */
  sharesRemaining?: number;
  isPrimary?: boolean;
  /**
   * Whether owned shares scale with V1 per-share (same $100 share class).
   * False → no position-scaled projection (no invented cross-layer rule).
   */
  scalePosition?: boolean;
  /** Routes into the existing buy flow (Slice G/H untouched). */
  onBuy: () => void;
}) {
  const t = useTranslations("property");
  if (v1 == null) return null;
  const pending = unavailableLabel("backend_absent");
  const perShare = v1.perShare;
  const showSupply = isPrimary && sharesRemaining > 0;
  const showProjected = scalePosition && ownedShares > 0 && perShare.annualCents != null;

  return (
    <section className="space-y-2" data-testid="ownership-v1-panel">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("ownershipV1Title")}
      </h2>
      <Block className="overflow-hidden" data-testid="ownership-v1-facts">
        <div className="py-1">
          <Row>
            <span className="text-sm text-muted-foreground">{t("ownershipV1SharePrice")}</span>
            <span className="ml-auto flex items-center gap-1.5" data-testid="ownership-v1-price">
              <span className="text-sm tnum font-semibold text-foreground">
                {usd(V1_NOMINAL_SHARE_PRICE_CENTS)}
              </span>
              <ProvenanceInfo provenance="estimated" />
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("ownershipV1TotalShares")}</span>
            <span className="ml-auto text-sm tnum font-semibold text-foreground" data-testid="ownership-v1-total">
              {v1.totalShares.toLocaleString()}
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("ownershipV1OneShare")}</span>
            <span className="ml-auto text-sm tnum font-semibold text-foreground" data-testid="ownership-v1-one-share">
              1 / {v1.totalShares.toLocaleString()}
            </span>
          </Row>
          {showProjected ? (
            <Row>
              <span className="text-sm text-muted-foreground">{t("ownershipV1Projected")}</span>
              <span className="ml-auto flex items-center gap-1.5" data-testid="ownership-v1-projected">
                <span className="text-sm tnum font-semibold text-foreground">
                  {money((perShare.annualCents ?? 0) * ownedShares, perShare.currency)} {t("incomeV1PerYear")}
                </span>
                <ProvenanceInfo provenance="projected" />
              </span>
            </Row>
          ) : ownedShares > 0 && perShare.annualCents == null ? (
            <Row>
              <span className="text-sm text-muted-foreground">{t("ownershipV1Projected")}</span>
              <span className="ml-auto flex items-center gap-1.5" data-testid="ownership-v1-projected">
                <span className="text-sm text-muted-foreground">{pending}</span>
                <ProvenanceInfo provenance="unknown" />
              </span>
            </Row>
          ) : null}
          {showSupply ? (
            <Row>
              <span className="text-sm text-muted-foreground">{t("ownershipV1Supply")}</span>
              <span className="ml-auto text-sm tnum font-semibold text-foreground" data-testid="ownership-v1-supply">
                {sharesRemaining.toLocaleString()}
              </span>
            </Row>
          ) : null}
        </div>
        <p className="px-4 pb-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
          {t("ownershipV1NominalNote")}
        </p>
        {perShare.annualCents == null && ownedShares > 0 && perShare.unknownReason ? (
          <p className="px-4 pb-1 text-[0.6875rem] leading-relaxed text-muted-foreground" data-testid="ownership-v1-unknown-note">
            {perShare.unknownReason}
          </p>
        ) : null}
        <div className="border-t border-border px-4 py-3">
          <p className="text-[0.8125rem] font-semibold text-foreground">{t("ownershipV1KnowTitle")}</p>
          <p className="pt-1 text-xs leading-relaxed text-muted-foreground">{t("ownershipV1KnowBody")}</p>
          <p className="pt-2 text-xs leading-relaxed text-muted-foreground" data-testid="ownership-v1-holders-note">
            {t("ownershipV1HoldersPending")}
          </p>
          <button
            type="button"
            onClick={onBuy}
            className="mt-3 flex h-[44px] w-full items-center justify-center rounded-[10px] bg-primary text-sm font-semibold text-primary-foreground transition-transform duration-[120ms] ease-out active:scale-[0.98]"
            data-testid="ownership-v1-buy"
          >
            {t("ownershipV1Buy")}
          </button>
        </div>
      </Block>
    </section>
  );
}

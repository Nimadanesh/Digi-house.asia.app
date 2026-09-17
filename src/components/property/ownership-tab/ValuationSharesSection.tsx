"use client";
// File responsibility: Ownership tab §1 — Valuation & Shares (Estate Page
// Structure §6.1): the four decision facts in a 2×2 grid — estate value (the
// ONE V1 valuation), reference value per share, total shares, ownership per
// share. All figures arrive via the V1 model; this section formats only.
import { useTranslations } from "next-intl";
import { moneySmart, usd } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import type { FinancialModelV1PropertyModel } from "@/types/financial-model-v1";
import { cn } from "@/lib/utils";
import { getPresentedPrimaryPrice } from "@/lib/economics/property-presentation";

function FactCell({
  label,
  value,
  caption,
  testId,
  muted = false,
  className = "",
}: {
  label: string;
  value: string;
  caption?: string | null;
  testId?: string;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[96px] w-full min-w-0 flex-col justify-center gap-1.5 overflow-hidden bg-card p-4 transition-colors duration-200 ease-out hover:bg-surface-2/50",
        className,
      )}
    >
      <span className="w-full truncate whitespace-nowrap text-[0.625rem] font-medium uppercase leading-tight tracking-[0.07em] text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "block w-full max-w-full truncate whitespace-nowrap text-[1.375rem] font-bold leading-none tracking-[-0.02em] tnum",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
        data-testid={testId}
      >
        {value}
      </span>
      {caption ? (
        <span className="block w-full break-all text-[0.6875rem] leading-snug tnum text-muted-foreground/90">{caption}</span>
      ) : null}
    </div>
  );
}

export function ValuationSharesSection({ v1 }: { v1: FinancialModelV1PropertyModel | null }) {
  const t = useTranslations("property");
  if (v1 == null) {
    return (
      <section className="space-y-2" data-testid="ownership-valuation">
        <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
          {t("ownershipValuationTitle")}
        </h2>
        <div className="bg-card rounded-[12px] p-4 shadow-sm ring-1 ring-border/50">
          <p className="text-sm text-muted-foreground">{unavailableLabel("backend_absent")}</p>
        </div>
      </section>
    );
  }
  return (
    <section className="min-w-0 space-y-2" data-testid="ownership-valuation">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("ownershipValuationTitle")}
      </h2>
      <div className="bg-card grid w-full min-w-0 grid-cols-2 overflow-hidden rounded-[12px] shadow-sm ring-1 ring-border/50">
        <FactCell
          label={t("estateValue")}
          value={moneySmart(v1.valuation.valueCents, v1.valuation.currency)}
          className="border-b border-r border-border/50"
          testId="ownership-valuation-value"
        />
        <FactCell
          label={t("invReferenceValue")}
          // The V1 nominal share price — valuation ÷ shares by construction.
          value={usd(getPresentedPrimaryPrice())}
          className="border-b border-border/50"
          testId="ownership-valuation-reference"
        />
        <FactCell
          label={t("ownershipV1TotalShares")}
          value={v1.totalShares.toLocaleString()}
          className="border-r border-border/50"
          testId="ownership-valuation-shares"
        />
        <FactCell
          label={t("invOwnershipPerShare")}
          value={`1 / ${v1.totalShares.toLocaleString()}`}
          // Exact fraction of the estate one share carries (e.g. 0.00125%).
          caption={
            v1.totalShares > 0 ? `${((1 / v1.totalShares) * 100).toString()}%` : null
          }
          testId="ownership-valuation-per-share"
        />
      </div>
    </section>
  );
}

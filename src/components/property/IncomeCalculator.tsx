"use client";
// File responsibility: "How much can I earn?" investment calculator — shares slider +
// numeric input, Conservative/Base/Optimistic segment, prominent result card with an
// in-card Buy CTA (REDESIGN-SPEC Phase 2).
// Yield math stays in lib/property-yield (positionYieldUsd) — no formulas here.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { usd } from "@/lib/format";
import type { Listing } from "@/types/property";
import { positionYieldUsd } from "@/lib/property-yield";
import { Block } from "@/components/common/Block";
import { haptics } from "@/lib/telegram/haptics";

type Scenario = "conservative" | "base" | "optimistic";

const SCENARIOS: { id: Scenario; labelKey: string }[] = [
  { id: "conservative", labelKey: "scenarioConservative" },
  { id: "base", labelKey: "scenarioBase" },
  { id: "optimistic", labelKey: "scenarioOptimistic" },
];

export function IncomeCalculator({
  listing,
  shares,
  onSharesChange,
  ownedShares = 0,
  lockedShares = 0,
  onBuy,
  currentPriceUsd,
}: {
  listing: Listing;
  shares: number;
  onSharesChange: (n: number) => void;
  /** Shares the user already owns — raises the floor (spec: min 1 or owned, whichever is higher). */
  ownedShares?: number;
  /** Subset of owned shares currently locked and earning. */
  lockedShares?: number;
  /** Opens the same buy flow as Hero/Sticky CTAs, pre-seeded with this share count. */
  onBuy: (shares: number) => void;
  /** Single source of truth (lib/property-price); defaults to list price. */
  currentPriceUsd?: number;
}) {
  // REDESIGN-SPEC Phase 2: scenario coefficients don't exist yet — Base is the only
  // computed scenario; the other two reuse the same numbers until Phase 2b lands.
  const t = useTranslations("property");
  const [scenario, setScenario] = useState<Scenario>("base");
  const [draft, setDraft] = useState<string | null>(null);

  const min = Math.max(1, ownedShares);
  const capRaw = listing.sharesRemaining > 0 ? listing.sharesRemaining : listing.totalShares;
  const max = Math.max(min, capRaw);
  const clamped = Math.min(max, Math.max(min, shares));
  const { monthlyUsd, annualUsd } = positionYieldUsd(listing, clamped);
  // Cost basis uses the same single source of truth as Hero/Metrics/Sticky/Chart.
  const unitPriceUsd = currentPriceUsd ?? listing.sharePriceUsd;
  const totalCostUsd = clamped * unitPriceUsd;

  function setShares(n: number) {
    haptics.selection();
    onSharesChange(n);
  }

  return (
    <Block className="space-y-4 p-4" data-testid="income-calculator">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[0.9375rem] font-semibold text-foreground">{t("calcTitle")}</h2>
        {ownedShares > 0 ? (
          <span className="rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-medium text-success tnum" data-testid="owned-pill">
            {t("calcYouOwn", { count: ownedShares })}
            {lockedShares > 0 ? t("calcLockedSuffix", { count: lockedShares }) : ""}
          </span>
        ) : null}
      </div>

      {/* Share amount: stepper + editable numeric input */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{t("calcSharesLabel")}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t("calcDecreaseShares")}
            disabled={clamped <= min}
            onClick={() => setShares(Math.max(min, clamped - 1))}
            className="flex size-11 items-center justify-center rounded-[10px] bg-surface-2 transition-transform duration-[120ms] ease-out active:scale-[0.97] disabled:opacity-40"
          >
            <Minus size={18} strokeWidth={1.75} />
          </button>
          <input
            type="text"
            inputMode="numeric"
            aria-label={t("calcSharesInput")}
            value={draft ?? String(clamped)}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 6);
              setDraft(v);
              if (v !== "") onSharesChange(Number(v));
            }}
            onBlur={() => {
              setDraft(null);
              if (draft !== null && draft !== "") setShares(clamped);
            }}
            className="h-11 w-16 rounded-[10px] bg-surface-2 text-center text-lg font-semibold tnum text-foreground outline-none focus:ring-1 focus:ring-primary"
            data-testid="income-shares-input"
          />
          <button
            type="button"
            aria-label={t("calcIncreaseShares")}
            disabled={clamped >= max}
            onClick={() => setShares(Math.min(max, clamped + 1))}
            className="flex size-11 items-center justify-center rounded-[10px] bg-surface-2 transition-transform duration-[120ms] ease-out active:scale-[0.97] disabled:opacity-40"
          >
            <Plus size={18} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={min}
        max={max}
        value={clamped}
        aria-label={t("calcSharesSlider")}
        onChange={(e) => setShares(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-primary [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        data-testid="income-slider"
      />

      {/* Scenario segment — Conservative / Base / Optimistic */}
      <div className="flex rounded-[10px] bg-surface-2 p-1" data-testid="scenario-segment">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={scenario === s.id}
            onClick={() => {
              haptics.selection();
              setScenario(s.id);
            }}
            className={`h-9 flex-1 rounded-[8px] text-[0.8125rem] transition-colors duration-200 ease-out ${
              scenario === s.id ? "bg-card font-semibold text-foreground" : "text-muted-foreground"
            }`}
            data-testid={`scenario-${s.id}`}
          >
            {t(s.labelKey)}
          </button>
        ))}
      </div>

      {/* Result card */}
      <div className="space-y-2 rounded-[12px] bg-surface-2 p-4" data-testid="calc-result">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("calcProjected")}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[1.75rem] font-bold leading-none tracking-tight text-success tnum" data-testid="calc-monthly">
            {usd(monthlyUsd)}
          </span>
          <span className="text-sm text-muted-foreground">{t("perMonthWord")}</span>
        </div>
        <p className="text-sm text-muted-foreground tnum" data-testid="calc-yearly">
          ≈ {usd(annualUsd)} {t("perYearWord")}
        </p>
        <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
          {t("calcFeesNote")}
        </p>
        <button
          type="button"
          disabled={listing.status === "funding" && listing.sharesRemaining <= 0}
          onClick={() => {
            haptics.impact("light");
            onBuy(clamped);
          }}
          className="mt-1 flex h-11 w-full items-center justify-center rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground transition-transform duration-[120ms] ease-out active:scale-[0.98] disabled:opacity-50"
          data-testid="calc-buy"
        >
          {t("calcBuyCta", {
            count: clamped,
            unit: clamped === 1 ? t("shareWord") : t("sharesWord"),
            cost: usd(totalCostUsd),
          })}
        </button>
      </div>
    </Block>
  );
}

"use client";
// File responsibility: Income tab §1 — Rental Basis (structure §5.1 + revision
// contract): the ANR / modeled-occupancy metric pair side by side (glanceable
// unit + meaning via captions), and the historical-occupancy disclosure as a
// collapsed expandable row. V1 is the only calculation authority; this section
// formats, never computes.
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { moneySmart } from "@/lib/format";
import { v1AnrToCents } from "@/lib/economics/financial-model-v1";
import { v1ModeledOccupancyPct } from "@/lib/economics/property-presentation";
import type { FinancialModelV1PropertyModel } from "@/types/financial-model-v1";
import { cn } from "@/lib/utils";
import { Block } from "@/components/common/Block";

function MetricCell({
  label,
  value,
  caption,
  testId,
}: {
  label: string;
  value: string;
  caption: string;
  testId?: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-[0.625rem] font-medium uppercase leading-tight tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p
        className="truncate whitespace-nowrap pt-1 text-[1.375rem] font-bold leading-none tracking-tight tnum text-foreground"
        data-testid={testId}
      >
        {value}
      </p>
      <p className="pt-1.5 text-xs leading-relaxed text-muted-foreground">{caption}</p>
    </div>
  );
}

export function RentalBasisSection({ v1 }: { v1: FinancialModelV1PropertyModel | null }) {
  const t = useTranslations("property");
  const [historyOpen, setHistoryOpen] = useState(false);
  if (v1 == null) return null;
  const anrCents = v1AnrToCents(v1.anr.valueMajor);
  const avgOccupancy = v1ModeledOccupancyPct(v1.average, v1);
  return (
    <section className="space-y-2" data-testid="income-basis">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("incomeV1Basis")}
      </h2>
      <Block className="p-4 shadow-sm ring-1 ring-border/50 sm:p-5">
        <div className="flex gap-4">
          <MetricCell
            label={t("v1ThesisAnr")}
            value={moneySmart(anrCents, v1.currency)}
            caption={t("incomeAnrCaption")}
            testId="income-basis-anr"
          />
          {avgOccupancy != null ? (
            <MetricCell
              label={t("incomeOccupancyModeled")}
              value={`≈${avgOccupancy}%`}
              caption={t("incomeOccupancyModeledNoteShort")}
              testId="income-basis-occupancy"
            />
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setHistoryOpen((v) => !v)}
          aria-expanded={historyOpen}
          aria-controls="income-basis-history"
          className="mt-2 flex min-h-[44px] w-full items-center justify-between gap-2 border-t border-border/50 text-start transition-transform duration-150 ease-out active:scale-[0.99]"
          data-testid="income-basis-history-toggle"
        >
          <span className="min-w-0 truncate text-sm text-muted-foreground">
            {t("incomeOccupancyHistorical")}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="whitespace-nowrap text-sm tnum font-semibold text-muted-foreground">
              {t("incomeOccupancyHistoricalValue")}
            </span>
            <ChevronDown
              size={16}
              strokeWidth={1.75}
              aria-hidden
                className={cn(
                  "text-muted-foreground transition-transform duration-150 ease-out",
                  historyOpen ? "rotate-180" : "",
                )}
            />
          </span>
        </button>
        {historyOpen ? (
          <div id="income-basis-history" className="rounded-[10px] bg-surface-2/50 px-3 py-2" data-testid="income-basis-history">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("incomeOccupancyHistoricalNoteLine1")}
            </p>
            <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
              {t("incomeOccupancyHistoricalNoteLine2")}
            </p>
          </div>
        ) : null}
      </Block>
    </section>
  );
}

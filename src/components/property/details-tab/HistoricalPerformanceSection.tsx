"use client";
// File responsibility: Details tab §5 — Historical Performance (Estate Page
// Structure §7.5): honest disclosure only — no public per-villa historical
// dataset exists (D8 CONFIRMED). Simulated history is never presented as
// performance; real figures appear after the first 12 months of operation.
import { useTranslations } from "next-intl";
import { ESTATE_HISTORICAL_PERFORMANCE } from "@/lib/economics/estates/estate-page-constants";
import { Block } from "@/components/common/Block";

export function HistoricalPerformanceSection() {
  const t = useTranslations("property");
  return (
    <section className="space-y-2" data-testid="details-historical">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("historicalTitle")}
      </h2>
      <Block className="p-4" data-testid="details-historical-card">
        <p className="text-sm text-foreground">{ESTATE_HISTORICAL_PERFORMANCE.unavailableLine}</p>
        <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
          {ESTATE_HISTORICAL_PERFORMANCE.pendingLine}
        </p>
        <p className="pt-2 text-xs leading-relaxed text-muted-foreground/80">
          {t("historicalNote")}
        </p>
      </Block>
    </section>
  );
}

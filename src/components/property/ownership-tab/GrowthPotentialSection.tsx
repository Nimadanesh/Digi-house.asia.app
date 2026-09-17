"use client";
// File responsibility: Ownership tab §2 — Growth Potential (structure §6.2 +
// revision contract): the locked D10 assumed band as the primary large metric
// (+3% to +5% per year, estimated/illustrative) with its source caption, and
// the research-derived upper valuation estimate as a collapsed expandable row
// (TaskRows pattern). Two distinct valuation concepts, clearly labeled, never
// mixed with rental income. Facts come from the locked constants + canonical
// layer; this section formats only.
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { ESTATE_GROWTH_ASSUMPTION } from "@/lib/economics/estates/estate-page-constants";
import type { GrowthPotential } from "@/lib/economics/estates/growth-potential";
import { Block } from "@/components/common/Block";

export function GrowthPotentialSection({
  growthPotential,
}: {
  growthPotential: GrowthPotential | null;
}) {
  const t = useTranslations("property");
  const [researchOpen, setResearchOpen] = useState(false);
  const a = ESTATE_GROWTH_ASSUMPTION;
  return (
    <section className="space-y-2" data-testid="ownership-growth">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("growthPotentialTitle")}
      </h2>
      <Block className="rounded-[12px] p-5 shadow-sm ring-1 ring-border/60">
        <p
          className="whitespace-nowrap text-[1.375rem] font-bold leading-none tracking-[-0.02em] tnum text-foreground"
          data-testid="ownership-growth-assumed"
        >
          {a.displayLabel}
        </p>
        {/* Single short caption — the long locked paragraph was duplicated copy. */}
        <p className="pt-1.5 text-xs leading-relaxed text-muted-foreground">
          {t("growthAssumedCaption")}
        </p>
        {growthPotential ? (
          <>
            <button
              type="button"
              onClick={() => setResearchOpen((v) => !v)}
              aria-expanded={researchOpen}
              aria-controls="ownership-growth-research"
              className="mt-3 flex min-h-[44px] w-full items-center justify-between gap-3 border-t border-border/60 text-start transition-transform duration-200 ease-out active:scale-[0.99]"
              data-testid="ownership-growth-research-toggle"
            >
              <span className="min-w-0 truncate text-[0.8125rem] text-muted-foreground">
                {t("growthResearchLabel")}
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="whitespace-nowrap text-sm tnum font-semibold tracking-tight text-foreground">
                  {usd(growthPotential.potentialValue)}
                </span>
                <ChevronDown
                  size={16}
                  strokeWidth={1.75}
                  aria-hidden
                  className={`text-muted-foreground/80 transition-transform duration-200 ease-out ${researchOpen ? "rotate-180" : ""}`}
                />
              </span>
            </button>
            {researchOpen ? (
              <div id="ownership-growth-research" className="mt-1 rounded-[10px] bg-surface-2/70 p-3 ring-1 ring-border/40" data-testid="ownership-growth-research">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t("growthResearchNoteLine1")}
                </p>
                <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
                  {t("growthPotentialNote")}
                </p>
              </div>
            ) : null}
          </>
        ) : null}
      </Block>
    </section>
  );
}

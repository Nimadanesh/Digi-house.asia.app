"use client";
// File responsibility: Ownership tab §5 — Risk Disclosures (Estate Page
// Structure §6.5): the six locked risk statements (estate-page-constants) in
// collapsible rows. Content is shared across all 24 villas — nothing is
// invented per villa. Each row is independently collapsed by default; the
// shared Disclosure primitive is controlled, so each row owns its open state.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { ESTATE_RISK_DISCLOSURES } from "@/lib/economics/estates/estate-page-constants";
import { cn } from "@/lib/utils";

function RiskRow({ id, title, text }: { id: number; title: string; text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`risk-content-${id}`}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 px-4 py-2 text-start transition-transform duration-[120ms] ease-out active:scale-[0.99]"
        data-testid={`risk-toggle-${id}`}
      >
        <span className="min-w-0 truncate text-sm text-foreground">{title}</span>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          aria-hidden
          className={cn("shrink-0 text-muted-foreground transition-transform duration-200 ease-out", open ? "rotate-180" : "")}
        />
      </button>
      {open ? (
        <p className="px-4 pb-3 text-sm leading-relaxed text-muted-foreground" data-testid={`risk-content-${id}`}>
          {text}
        </p>
      ) : null}
    </div>
  );
}

export function RiskDisclosuresSection() {
  const t = useTranslations("property");
  return (
    <section className="space-y-2" data-testid="ownership-risks">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("riskDisclosuresTitle")}
      </h2>
      <div className="bg-card overflow-hidden rounded-[12px]">
        <div className="divide-y divide-border">
          {ESTATE_RISK_DISCLOSURES.map((risk) => (
            <RiskRow key={risk.id} id={risk.id} title={risk.title} text={risk.text} />
          ))}
        </div>
      </div>
      <p className="px-0.5 text-xs leading-relaxed text-muted-foreground">
        {t("riskDisclosuresNote")}
      </p>
    </section>
  );
}

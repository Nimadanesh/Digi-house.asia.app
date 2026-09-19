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
    <div
      className={cn(
        "transition-colors duration-200 ease-out",
        open ? "bg-surface-2/60" : "bg-transparent hover:bg-surface-2/40",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`risk-content-${id}`}
        className="flex min-h-[44px] w-full items-center justify-between gap-3 px-4 py-3 text-start transition-transform duration-200 ease-out active:scale-[0.99]"
        data-testid={`risk-toggle-${id}`}
      >
        <span className={cn("min-w-0 truncate text-[0.84375rem] leading-snug tracking-[-0.01em] text-foreground", open ? "font-semibold" : "font-medium")}>{title}</span>
        <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 ring-border/40 transition-colors duration-200 ease-out", open ? "bg-card" : "bg-surface-2/60")}>
          <ChevronDown
            size={14}
            strokeWidth={1.75}
            aria-hidden
            className={cn("text-muted-foreground transition-transform duration-200 ease-out", open ? "rotate-180" : "")}
          />
        </span>
      </button>
      {open ? (
        <p
          id={`risk-content-${id}`}
          className="mx-4 mb-3 rounded-[8px] bg-surface-2/70 px-3 py-2.5 text-[0.8125rem] leading-relaxed text-muted-foreground ring-1 ring-border/30"
          data-testid={`risk-content-${id}`}
        >
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
      <div className="bg-card overflow-hidden rounded-[12px] shadow-sm ring-1 ring-border/50">
        <div className="divide-y divide-border/50">
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

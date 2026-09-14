"use client";
// File responsibility: THE global provenance indicator (FractionalLuxe design
// system rule) — a compact ⓘ affordance beside a figure; tap opens a bottom
// sheet with a plain-language explanation of that figure's provenance.
//
// GLOBAL RULE (all slices): do not introduce repeated visible provenance
// badges/labels beside every financial number — use this interaction instead.
// Provenance stays intact in data/view-model layers; this file only changes
// presentation from always-visible to available-on-demand.
//
// Interaction reuses the established primitives: self-contained open state +
// haptics and a span trigger with button semantics (FeeInfoButton pattern — a
// real <button> would be invalid HTML inside ancestor toggle buttons such as
// the cost-breakdown expander, causing hydration errors) and the Telegram-style
// Sheet (BackButton, Esc and backdrop dismissal, safe-area aware, max-w-480).
import { useId, useState } from "react";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Provenance } from "@/types/estate";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";
import { Sheet } from "./Sheet";

const COPY_KEY = {
  observed: "provInfoObserved",
  estimated: "provInfoEstimated",
  calculated: "provInfoCalculated",
  projected: "provInfoProjected",
  unknown: "provInfoUnknown",
} as const;

export function ProvenanceInfo({
  provenance,
  className,
}: {
  provenance: Provenance;
  className?: string;
}) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const key = COPY_KEY[provenance];
  const title = t(`${key}Title`);
  const body = t(`${key}Body`);

  function handleOpen() {
    haptics.impact("light");
    setOpen(true);
  }

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        aria-label={title}
        aria-haspopup="dialog"
        data-testid="provenance-info"
        data-provenance={provenance}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleOpen();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            handleOpen();
          }
        }}
        className={cn(
          "inline-flex size-7 shrink-0 cursor-pointer select-none items-center justify-center rounded-full text-muted-foreground transition-transform duration-[120ms] ease-out active:scale-95",
          className,
        )}
      >
        <Info size={13} strokeWidth={2} aria-hidden />
      </span>
      <Sheet open={open} onClose={() => setOpen(false)} labelledBy={titleId}>
        <div className="space-y-1.5 pb-2" data-testid="provenance-sheet" data-provenance={provenance}>
          <h2 id={titleId} className="text-[1.0625rem] font-semibold text-foreground">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
        </div>
      </Sheet>
    </>
  );
}

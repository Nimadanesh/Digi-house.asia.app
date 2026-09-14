"use client";
// File responsibility: THE fact-row pattern for tab content (DEC-014, Layer 2
// redesign) — one aligned, tappable row everywhere a label meets a figure.
//
// Rules this component enforces globally (user directive, 2026-09-12):
// 1. The provenance ⓘ sits BEFORE the label text (start side) — the value side
//    stays pure and right-aligned; long figures never wrap or push the row.
// 2. The WHOLE row is tappable and opens the provenance sheet (wherever an ⓘ
//    exists, tapping the row must open it — never icon-only).
// 3. Values render with tabular figures and whitespace-nowrap; callers pass
//    compact money (moneyCompact: M/K) so a row can never break onto a second
//    line.
// 4. Long captions clamp to 3 lines with a Show more/less toggle — extra
//    content must never break the row alignment.
//
// Reuses the established Sheet + haptics primitives (ProvenanceInfo pattern);
// the row is a real <button> for a11y (rows never sit inside other buttons —
// callers keep FactRow out of toggles, same rule as FeeInfoButton).
import { useId, useRef, useState } from "react";
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

/** 3-line clamp with an honest Show more/less toggle (only when clamped). */
export function ClampText({
  text,
  testId,
}: {
  text: string;
  testId?: string;
}) {
  const tt = useTranslations("common");
  const ref = useRef<HTMLParagraphElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const check = () => {
    const el = ref.current;
    if (el != null && "scrollHeight" in el) {
      setClamped(el.scrollHeight > el.clientHeight + 1);
    }
  };
  return (
    <div>
      <p
        ref={(el) => {
          ref.current = el;
          check();
          if (el != null) requestAnimationFrame(check);
        }}
        className={cn(
          "text-xs leading-relaxed text-muted-foreground",
          !expanded && "line-clamp-3",
        )}
        data-testid={testId ?? "fact-row-caption"}
      >
        {text}
      </p>
      {clamped ? (
        <button
          type="button"
          onClick={() => {
            haptics.selection();
            setExpanded((v) => !v);
          }}
          className="mt-0.5 text-xs font-medium text-primary"
          data-testid="fact-row-caption-toggle"
        >
          {expanded ? tt("showLess") : tt("showMore")}
        </button>
      ) : null}
    </div>
  );
}

export function FactRow({
  label,
  value,
  valueTestId,
  provenance,
  caption,
  muted = false,
  valueMuted = false,
  wrapValue = false,
  captionTestId,
}: {
  label: string;
  /** Rendered value — callers pass compact money so it never wraps. */
  value: string;
  /** Long TEXT values (resort names, statuses) wrap instead of truncating. */
  valueTestId?: string;
  /** Provenance for the ⓘ + row-tap sheet. Absent → plain row (not tappable). */
  provenance?: Provenance | null;
  /** Optional long caption under the row — clamped to 3 lines with a toggle. */
  caption?: string | null;
  /** Optional dedicated testid for the caption (callers' regression pins). */
  captionTestId?: string;
  /** Label weight (secondary rows). */
  muted?: boolean;
  /** Pending values render quieter than hard numbers. */
  valueMuted?: boolean;
  /** Long TEXT values (resort names, statuses) wrap instead of truncating. */
  wrapValue?: boolean;
}) {
  const t = useTranslations("common");
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const tappable = provenance != null;

  const inner = (
    <>
      <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
        {tappable ? (
          <Info size={14} strokeWidth={2} className="shrink-0 text-muted-foreground/70" aria-hidden />
        ) : null}
        <span className={cn("min-w-0 truncate", muted && "text-muted-foreground/80")}>{label}</span>
      </span>
      <span
        className={cn(
          wrapValue
            ? "shrink-0 text-right text-sm leading-snug text-foreground"
            : "shrink-0 whitespace-nowrap text-sm tnum font-medium",
          valueMuted ? "text-muted-foreground" : "text-foreground",
        )}
        data-testid={valueTestId}
      >
        {value}
      </span>
    </>
  );

  return (
    <div className="min-w-0">
      {tappable ? (
        <button
          type="button"
          onClick={() => {
            haptics.selection();
            setOpen(true);
          }}
          className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-2 py-1.5 text-start transition-transform duration-[120ms] ease-out active:scale-[0.99]"
          data-testid="fact-row"
          data-provenance={provenance}
        >
          {inner}
        </button>
      ) : (
        <div
          className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-2 py-1.5"
          data-testid="fact-row"
        >
          {inner}
        </div>
      )}
      {caption ? <div className="pb-1"><ClampText text={caption} testId={captionTestId} /></div> : null}
      {tappable ? (
        <Sheet open={open} onClose={() => setOpen(false)} labelledBy={titleId}>
          <div className="space-y-1.5 pb-2" data-testid="fact-row-sheet" data-provenance={provenance}>
            <h2 id={titleId} className="text-[1.0625rem] font-semibold text-foreground">
              {t(`${COPY_KEY[provenance as keyof typeof COPY_KEY] ?? "provInfoUnknown"}Title`)}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(`${COPY_KEY[provenance as keyof typeof COPY_KEY] ?? "provInfoUnknown"}Body`)}
            </p>
          </div>
        </Sheet>
      ) : null}
    </div>
  );
}

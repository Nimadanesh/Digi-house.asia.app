"use client";
// File responsibility: horizontal allocation bar — compact by default, legend via progressive disclosure.
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { ALLOCATION_COLORS, type AllocationSlice } from "@/lib/portfolio-math";
import { pct } from "@/lib/format";
import { Block } from "@/components/common/Block";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

export function AllocationBar({
  slices,
  nameById,
}: {
  slices: AllocationSlice[];
  nameById: Record<string, string>;
}) {
  const t = useTranslations("portfolio");
  const [open, setOpen] = useState(false);
  if (slices.length === 0) return null;

  return (
    <section className="space-y-2" data-testid="portfolio-allocation">
      <Block className="overflow-hidden">
        <button
          type="button"
          onClick={() => {
            haptics.selection();
            setOpen((v) => !v);
          }}
          aria-expanded={open}
          className="flex w-full min-h-[48px] items-center gap-2 px-4 py-2.5 text-left active:scale-[0.97] transition-transform duration-[120ms] ease-out"
          data-testid="allocation-toggle"
        >
          <span className="text-[0.9375rem] font-semibold text-foreground">{t("allocation")}</span>
          <span className="ms-auto text-xs text-muted-foreground tnum">
            {t("allocationProperties", { count: slices.length })}
          </span>
          <ChevronDown
            size={20}
            strokeWidth={1.75}
            className={cn("shrink-0 text-muted-foreground transition-transform duration-200 ease-out", open && "rotate-180")}
            aria-hidden
          />
        </button>
        <div className="px-4 pb-4">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
            {slices.map((s, i) => (
              <div
                key={s.propertyId}
                className={cn("h-full min-w-0", ALLOCATION_COLORS[i % ALLOCATION_COLORS.length])}
                style={{ width: Math.max(s.ratio * 100, 0) + "%" }}
                title={nameById[s.propertyId] ?? s.propertyId}
              />
            ))}
          </div>
          {open ? (
            <ul className="mt-3 border-t border-border pt-3 space-y-1.5" data-testid="allocation-legend">
              {slices.map((s, i) => (
                <li key={s.propertyId} className="flex items-center gap-2 text-sm">
                  <span
                    className={cn("size-2.5 shrink-0 rounded-full", ALLOCATION_COLORS[i % ALLOCATION_COLORS.length])}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {nameById[s.propertyId] ?? s.propertyId}
                  </span>
                  <span className="tnum text-muted-foreground">{pct(s.ratio)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Block>
    </section>
  );
}

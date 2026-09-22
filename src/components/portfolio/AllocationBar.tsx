"use client";
// File responsibility: horizontal allocation bar — always-visible segmented bar + legend.
import { useTranslations } from "next-intl";
import { ALLOCATION_COLORS, type AllocationSlice } from "@/lib/portfolio-math";
import { pct } from "@/lib/format";
import { Block } from "@/components/common/Block";
import { cn } from "@/lib/utils";

export function AllocationBar({
  slices,
  nameById,
}: {
  slices: AllocationSlice[];
  nameById: Record<string, string>;
}) {
  const t = useTranslations("portfolio");
  if (slices.length === 0) return null;

  return (
    <section className="space-y-2" data-testid="portfolio-allocation">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("allocation")}{" "}
        <span className="font-normal text-muted-foreground tnum">
          · {t("allocationProperties", { count: slices.length })}
        </span>
      </h2>
      <Block className="p-4">
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
        <ul className="mt-3.5 space-y-2.5" data-testid="allocation-legend">
          {slices.map((s, i) => (
            <li key={s.propertyId} className="flex items-center gap-2.5 text-sm">
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
      </Block>
    </section>
  );
}

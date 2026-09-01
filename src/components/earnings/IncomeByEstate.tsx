"use client";
// File responsibility: Income by estate (UI Mapping §7.1 P0) — received (paid) income grouped
// per estate, each row links to the estate detail. Estates without paid entries are simply
// absent (honest — never a fabricated zero). Pure display: aggregates existing fields via
// groupIncomeByEstate; no new financial math.
import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Block } from "@/components/common/Block";
import { usd } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { groupIncomeByEstate } from "@/lib/earnings-stats";
import type { EarningsEntry } from "@/types/earnings";
import type { Listing } from "@/types/property";

const THUMB = "size-10 shrink-0 rounded-[10px] overflow-hidden bg-surface-2 relative";

export function IncomeByEstate({
  entries,
  propertyById,
}: {
  entries: EarningsEntry[];
  /** Estate metadata for resolving names/images; estates without entries simply absent. */
  propertyById: Map<string, Listing>;
}) {
  const t = useTranslations("earnings");

  const rows = useMemo(() => {
    const grouped = groupIncomeByEstate(entries);
    const out: { propertyId: string; receivedUsd: number; name: string; location: string; image?: string }[] = [];
    for (const [propertyId, { receivedUsd }] of grouped) {
      const p = propertyById.get(propertyId);
      out.push({
        propertyId,
        receivedUsd,
        name: p?.title ?? propertyId,
        location: p?.location ?? "",
        image: p?.images?.[0],
      });
    }
    return out;
  }, [entries, propertyById]);

  if (rows.length === 0) return null;

  return (
    <section className="space-y-2" data-testid="income-by-estate">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("byEstateTitle")}
      </h2>
      <Block className="overflow-hidden" data-testid="income-by-estate-block">
        {rows.map((row) => (
          <Link
            key={row.propertyId}
            href={`/property/${row.propertyId}`}
            onClick={() => haptics.selection()}
            className="flex min-h-[60px] items-center gap-3 px-4 py-2.5 transition-colors active:bg-surface-2"
            data-testid={`income-by-estate-row-${row.propertyId}`}
          >
            <div className={THUMB} aria-hidden>
              {row.image ? (
                <Image src={row.image} alt="" fill className="object-cover" sizes="40px" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.9375rem] font-medium leading-tight text-foreground">
                {row.name}
              </p>
              <p className="mt-0.5 truncate text-xs leading-snug text-muted-foreground">
                {row.location}
              </p>
            </div>
            <div className="shrink-0 text-right space-y-0.5">
              <p className="tnum text-[0.9375rem] font-semibold leading-tight text-foreground">
                {usd(row.receivedUsd)}
              </p>
              <p className="text-[0.6875rem] leading-snug text-muted-foreground">
                {t("byEstateReceived")}
              </p>
            </div>
            <ChevronRight
              size={18}
              strokeWidth={1.75}
              className="shrink-0 text-muted-foreground"
              aria-hidden
            />
          </Link>
        ))}
      </Block>
    </section>
  );
}

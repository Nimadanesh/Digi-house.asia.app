"use client";
// File responsibility: Block of EarningsEntryRows + payment summary counts.
import { Block } from "@/components/common/Block";
import { EarningsEntryRow } from "./EarningsEntryRow";
import type { EarningsEntry } from "@/types/earnings";

export function EarningsTimeline({
  entries,
  propertyNameById,
  propertyImageById,
  weeklyRentPoolUsdById,
  sharesOwnedById,
}: {
  entries: EarningsEntry[];
  propertyNameById: Record<string, string>;
  propertyImageById?: Record<string, string>;
  weeklyRentPoolUsdById: Record<string, number>;
  sharesOwnedById?: Record<string, number>;
}) {
  const received = entries.filter((e) => e.status === "paid").length;
  const total = entries.length;

  return (
    <section className="space-y-2" data-testid="earnings-payments">
      <div className="space-y-1.5 px-0.5">
        <h2 className="text-[0.9375rem] font-semibold leading-snug text-foreground">Payments</h2>
        <p
          className="pb-0.5 text-xs leading-relaxed text-muted-foreground tnum"
          data-testid="payments-summary"
        >
          {received} Payments Received · Total {total} Payments
        </p>
      </div>
      <Block className="overflow-hidden">
        {entries.map((e) => (
          <EarningsEntryRow
            key={e.id}
            entry={e}
            propertyName={propertyNameById[e.propertyId] ?? e.propertyId}
            propertyImage={propertyImageById?.[e.propertyId]}
            weeklyRentPoolUsd={weeklyRentPoolUsdById[e.propertyId] ?? 0}
            sharesOwned={sharesOwnedById?.[e.propertyId]}
          />
        ))}
      </Block>
    </section>
  );
}

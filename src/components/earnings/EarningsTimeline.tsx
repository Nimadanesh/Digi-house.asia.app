"use client";
// File responsibility: a Block of EarningsEntryRows (newest-first per DATA_MODELS ordering — the seed
// already emits entries newest-first; this component is order-preserving). Page supplies lookup maps
// so the row component stays free of lib/mock imports.
import { Block } from "@/components/common/Block";
import { EarningsEntryRow } from "./EarningsEntryRow";
import type { EarningsEntry } from "@/types/earnings";

export function EarningsTimeline({
  entries,
  propertyNameById,
  weeklyRentPoolUsdById,
}: {
  entries: EarningsEntry[];
  propertyNameById: Record<string, string>;
  weeklyRentPoolUsdById: Record<string, number>;
}) {
  return (
    <Block className="overflow-hidden">
      {entries.map((e) => (
        <EarningsEntryRow
          key={e.id}
          entry={e}
          propertyName={propertyNameById[e.propertyId] ?? e.propertyId}
          weeklyRentPoolUsd={weeklyRentPoolUsdById[e.propertyId] ?? 0}
        />
      ))}
    </Block>
  );
}
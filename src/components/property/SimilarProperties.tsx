"use client";
// File responsibility: "Similar properties" rail — 3–4 other listings, same country
// first then closest APY, horizontal scroll (REDESIGN-SPEC Phase 5).
import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/types/property";
import { useMarketplace } from "@/hooks/useMarketplace";
import { usd, pct } from "@/lib/format";
import { annualReturnRatio } from "@/lib/property-yield";
import { getCurrentSharePrice } from "@/lib/property-price";
import { ROUTES } from "@/lib/constants";
import { haptics } from "@/lib/telegram/haptics";

function countryOf(location: string): string {
  const tail = location.split(",").pop();
  return tail ? tail.trim().toLowerCase() : "";
}

/** Same country first, then closest APY; never includes the current listing. */
export function pickSimilar(current: Listing, all: Listing[], count = 4): Listing[] {
  const apy = annualReturnRatio(current);
  return all
    .filter((l) => l.id !== current.id)
    .sort((a, b) => {
      const sameA = countryOf(a.location) === countryOf(current.location) ? 0 : 1;
      const sameB = countryOf(b.location) === countryOf(current.location) ? 0 : 1;
      if (sameA !== sameB) return sameA - sameB;
      return Math.abs(annualReturnRatio(a) - apy) - Math.abs(annualReturnRatio(b) - apy);
    })
    .slice(0, count);
}

export function SimilarProperties({ listing }: { listing: Listing }) {
  const { data } = useMarketplace();
  const similar = useMemo(() => pickSimilar(listing, data ?? []), [listing, data]);

  if (similar.length === 0) return null;

  return (
    <section className="space-y-2" data-testid="similar-properties">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">Similar properties</h2>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {similar.map((l) => (
          <Link
            key={l.id}
            href={ROUTES.property(l.id)}
            onClick={() => haptics.selection()}
            className="w-[160px] shrink-0 snap-start overflow-hidden rounded-[12px] bg-card transition-transform duration-[120ms] ease-out active:scale-[0.98]"
            data-testid="similar-card"
          >
            <div className="relative h-[88px] w-full bg-surface-2">
              {l.images[0] ? (
                <Image src={l.images[0]} alt={l.title} fill className="object-cover" sizes="160px" />
              ) : null}
            </div>
            <div className="space-y-1 p-3">
              <p className="truncate text-[0.8125rem] font-semibold text-foreground">{l.title}</p>
              <p className="truncate text-xs text-muted-foreground">{l.location}</p>
              <p className="flex items-baseline justify-between gap-1 pt-0.5">
                <span className="text-xs font-semibold text-success tnum">
                  {pct(annualReturnRatio(l))} APY
                </span>
                <span className="text-xs text-muted-foreground tnum">
                  {usd(getCurrentSharePrice(l))}
                </span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

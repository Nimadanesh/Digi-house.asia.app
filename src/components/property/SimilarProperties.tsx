"use client";
// File responsibility: "Similar properties" rail — 3–4 other listings, same country
// first then closest canonical Estate Value, horizontal scroll (REDESIGN-SPEC Phase 5).
//
// PROMPT 03 canonicalization: identity (name/location/images/nightly) comes from
// the canonical layer with legacy fallbacks for unmapped ids only; the legacy
// APY badge is removed (fixture APY must not drive user-visible property facts —
// the card shows the canonical nightly display + current share price instead).
import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Listing } from "@/types/property";
import { useMarketplace } from "@/hooks/useMarketplace";
import { usd } from "@/lib/format";
import { getCanonicalEstate } from "@/lib/economics/estates/canonical-24";
import { getCurrentSharePrice } from "@/lib/property-price";
import { ROUTES } from "@/lib/constants";
import { haptics } from "@/lib/telegram/haptics";

function countryOf(location: string): string {
  const tail = location.split(",").pop();
  return tail ? tail.trim().toLowerCase() : "";
}

/** Canonical display identity for a rail card (legacy fallback for unmapped ids). */
function cardIdentity(l: Listing): { name: string; location: string; image: string | null; nightly: string | null } {
  const canonical = getCanonicalEstate(l.id);
  return {
    name: canonical?.name.value ?? l.title,
    location: canonical?.location.value ?? l.location,
    image: canonical?.images.urls[0] ?? l.images[0] ?? null,
    nightly: canonical?.observedRentalRate.display ?? l.nightlyRate ?? null,
  };
}

/** Canonical Estate Value for similarity ranking (0 when unknown → sorts last). */
function canonicalValueCents(l: Listing): number {
  return getCanonicalEstate(l.id)?.fractionalLuxe.valuationUsd.value ?? 0;
}

/** Same country first, then closest canonical Estate Value; never the current listing. */
export function pickSimilar(current: Listing, all: Listing[], count = 4): Listing[] {
  const value = canonicalValueCents(current);
  return all
    .filter((l) => l.id !== current.id)
    .sort((a, b) => {
      const sameA = countryOf(a.location) === countryOf(current.location) ? 0 : 1;
      const sameB = countryOf(b.location) === countryOf(current.location) ? 0 : 1;
      if (sameA !== sameB) return sameA - sameB;
      return Math.abs(canonicalValueCents(a) - value) - Math.abs(canonicalValueCents(b) - value);
    })
    .slice(0, count);
}

export function SimilarProperties({ listing }: { listing: Listing }) {
  const t = useTranslations("property");
  const { data } = useMarketplace();
  const similar = useMemo(() => pickSimilar(listing, data ?? []), [listing, data]);

  if (similar.length === 0) return null;

  return (
    <section className="space-y-2" data-testid="similar-properties">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">{t("similarProperties")}</h2>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {similar.map((l) => {
          const identity = cardIdentity(l);
          return (
            <Link
              key={l.id}
              href={ROUTES.property(l.id)}
              onClick={() => haptics.selection()}
              className="w-[160px] shrink-0 snap-start overflow-hidden rounded-[12px] bg-card transition-transform duration-[120ms] ease-out active:scale-[0.98]"
              data-testid="similar-card"
            >
              <div className="relative h-[88px] w-full bg-surface-2">
                {identity.image ? (
                  <Image src={identity.image} alt={identity.name} fill className="object-cover" sizes="160px" />
                ) : null}
              </div>
              <div className="space-y-1 p-3">
                <p className="truncate text-[0.8125rem] font-semibold text-foreground">{identity.name}</p>
                <p className="truncate text-xs text-muted-foreground">{identity.location}</p>
                <p className="flex items-baseline justify-between gap-1 pt-0.5">
                  <span className="truncate text-xs text-muted-foreground tnum">
                    {identity.nightly ?? ""}
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-foreground tnum">
                    {usd(getCurrentSharePrice(l))}
                  </span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

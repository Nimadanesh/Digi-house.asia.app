"use client";
// File responsibility: a single "My Estates" ownership row on Home (Phase 9 Slice 3, UI Mapping §3.1).
// Full-width row: thumbnail + estate name + ownership % (from the repo's shareRatio) + current value.
// Plain ownership vocabulary; no per-row yield figures (those belong to Estate Detail).
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usd, pct } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import type { Listing } from "@/types/property";
import type { Holding } from "@/types/position";
import { Block } from "@/components/common/Block";

export function HomePropertyChip({
  listing,
  holding,
  onNavigateHaptic,
}: {
  listing: Listing;
  holding: Holding;
  onNavigateHaptic?: () => void;
}) {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const cover = listing.images[0] ?? "/images/properties/p1.png";

  return (
    <Link
      href={ROUTES.property(listing.id)}
      onClick={() => onNavigateHaptic?.()}
      className="block active:scale-[0.98] transition-transform duration-[120ms] ease-out"
      data-testid="home-property-chip"
    >
      <Block className="overflow-hidden">
        <div className="flex items-center gap-3 p-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-[10px] bg-surface-2">
            <Image src={cover} alt="" fill className="object-cover" sizes="56px" />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[0.9375rem] font-semibold leading-snug text-foreground">
                {listing.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground tnum">
                {t("ownShareOfEstate", { pct: pct(holding.shareRatio) })} ·{" "}
                {holding.sharesOwned} {tCommon("shares")}
              </p>
            </div>
            <div className="shrink-0 text-end">
              <p className="text-xs font-semibold tnum text-foreground">
                {usd(holding.currentValueUsd)}
              </p>
              <p className="mt-0.5 text-[0.6875rem] leading-snug text-muted-foreground">
                {t("currentValue")}
              </p>
            </div>
          </div>
        </div>
      </Block>
    </Link>
  );
}
"use client";
// File responsibility: "Your estates" holdings-only sheet — one row per estate the user
// owns (thumbnail, name, shares/%, current value). Tap navigates to that estate's
// page. Binds existing Holding + Listing fields only; no math, no wallet/lock CTAs.
import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usd, pct } from "@/lib/format";
import { Sheet } from "@/components/common/Sheet";
import { Block } from "@/components/common/Block";
import { haptics } from "@/lib/telegram/haptics";
import { ROUTES } from "@/lib/constants";
import type { Holding } from "@/types/position";
import type { Listing } from "@/types/property";

export function HomeEstatesSheet({
  open,
  onClose,
  holdings,
  listings,
}: {
  open: boolean;
  onClose: () => void;
  holdings: Holding[];
  listings: Listing[];
}) {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");

  const byId = useMemo(() => {
    const m = new Map<string, Listing>();
    for (const l of listings) m.set(l.id, l);
    return m;
  }, [listings]);

  return (
    <Sheet open={open} onClose={onClose} labelledBy="home-estates-title">
      <div className="space-y-3 pb-3" data-testid="home-estates-sheet">
        <h2
          id="home-estates-title"
          className="text-[1.0625rem] font-semibold leading-snug text-foreground"
        >
          {t("estatesSheetTitle")}
        </h2>
        <Block className="px-4 py-1">
          {holdings.map((h) => {
            const listing = byId.get(h.propertyId);
            const cover = listing?.images[0] ?? "/images/properties/p1.png";
            return (
              <Link
                key={h.propertyId}
                href={ROUTES.property(h.propertyId)}
                onClick={() => {
                  haptics.selection();
                  onClose();
                }}
                data-testid={"estates-row-" + h.propertyId}
                className="flex min-h-[56px] items-center gap-3 border-t border-border py-2.5 first:border-t-0"
              >
                <span className="relative size-10 shrink-0 overflow-hidden rounded-[10px] bg-surface-2">
                  <Image src={cover} alt="" fill sizes="40px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold leading-snug text-foreground">
                    {listing?.title ?? h.propertyId}
                  </span>
                  <span className="block truncate text-xs leading-relaxed text-muted-foreground tnum">
                    {pct(h.shareRatio)} · {h.sharesOwned} {tCommon("shares")}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tnum text-foreground">
                  {usd(h.currentValueUsd)}
                </span>
              </Link>
            );
          })}
        </Block>
      </div>
    </Sheet>
  );
}

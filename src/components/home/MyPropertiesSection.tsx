"use client";
// File responsibility: My Properties row — title + View All + horizontal chips or empty CTA (Fable).
import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/types/property";
import type { Holding } from "@/types/position";
import { ROUTES } from "@/lib/constants";
import { HomePropertyChip } from "./HomePropertyChip";
import { Block } from "@/components/common/Block";

export function MyPropertiesSection({
  holdings,
  listingById,
  onNavigateHaptic,
}: {
  holdings: Holding[];
  listingById: Map<string, Listing>;
  onNavigateHaptic?: () => void;
}) {
  return (
    <section className="space-y-2" data-testid="my-properties-section">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-[0.9375rem] font-semibold text-foreground">
          My Properties{holdings.length > 0 ? ` (${holdings.length})` : ""}
        </h2>
        <Link
          href={ROUTES.portfolio}
          onClick={() => onNavigateHaptic?.()}
          className="text-sm font-medium text-primary min-h-[44px] inline-flex items-center"
        >
          View All
        </Link>
      </div>

      {holdings.length === 0 ? (
        <Block className="overflow-hidden" data-testid="first-share-empty">
          <div className="relative h-28 bg-surface-2">
            <Image
              src="/images/properties/p1.png"
              alt=""
              fill
              className="object-cover opacity-80"
              sizes="(max-width: 480px) 100vw, 480px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          </div>
          <div className="space-y-3 p-4 -mt-6 relative">
            <p className="text-[0.9375rem] font-semibold text-foreground">Buy your first share</p>
            <p className="text-sm text-muted-foreground">
              Own a slice — earn projected rent every Friday.
            </p>
            <Link
              href={ROUTES.marketplace}
              onClick={() => onNavigateHaptic?.()}
              className="inline-flex h-[44px] w-full items-center justify-center rounded-[10px] bg-primary text-sm font-semibold text-primary-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out"
            >
              Browse Marketplace
            </Link>
          </div>
        </Block>
      ) : (
        <div
          className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
          data-testid="my-properties-scroll"
        >
          {holdings.map((h) => {
            const listing = listingById.get(h.propertyId);
            if (!listing) return null;
            return (
              <HomePropertyChip
                key={h.propertyId}
                listing={listing}
                holding={h}
                onNavigateHaptic={onNavigateHaptic}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

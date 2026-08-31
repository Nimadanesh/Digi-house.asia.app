"use client";
// File responsibility: one editorial Featured Estate on Home (Phase 9 Slice 3, redesign §5 /
// UI Mapping §3.1). Identity-first: premium image, estate name + destination, entry/share price,
// projected rental income (existing calculator math only), an honest owner-stay "Data pending"
// state (no entitlement data exists anywhere in the model), and a View Estate CTA. No APY badge,
// no scarcity/flame cues. The estate selection stays with pickFeaturedListing (unchanged reusable base).
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { shareWeeklyYieldUsd } from "@/lib/property-yield";
import { ROUTES } from "@/lib/constants";
import type { Listing } from "@/types/property";
import { Block } from "@/components/common/Block";
import { FundingBar } from "@/components/property/FundingBar";

export function FeaturedPropertyCard({
  listing,
  onNavigateHaptic,
}: {
  listing: Listing;
  onNavigateHaptic?: () => void;
}) {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const monthly = (shareWeeklyYieldUsd(listing) * 52) / 12;
  const cover = listing.images[0] ?? "/images/properties/p1.png";

  return (
    <section className="space-y-2" data-testid="featured-section">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">{t("featuredEstate")}</h2>
      <Link
        href={ROUTES.property(listing.id)}
        onClick={() => onNavigateHaptic?.()}
        className="block active:scale-[0.99] transition-transform duration-[120ms] ease-out"
        data-testid="featured-card"
      >
        <Block className="overflow-hidden">
          <div className="relative aspect-[16/9] bg-surface-2">
            <Image
              src={cover}
              alt={listing.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width:480px) 100vw, 480px"
            />
            <span className="absolute top-2.5 start-2.5 rounded-full bg-primary/90 px-2.5 py-1 text-[0.6875rem] font-semibold text-white">
              {t("featuredTag")}
            </span>
          </div>
          <div className="space-y-2 p-4">
            <div className="space-y-1.5">
              <p className="text-[0.9375rem] font-semibold leading-snug text-foreground">{listing.title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{listing.location}</p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{tCommon("from")}</span>
              <span className="font-semibold tnum text-foreground">
                {usd(listing.sharePriceUsd)}/{tCommon("share")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("projectedIncomePerShare")}</span>
              <span className="font-medium tnum text-success">{usd(monthly)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("ownerStay")}</span>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[0.6875rem] font-medium tnum text-muted-foreground">
                {t("dataPending")}
              </span>
            </div>
            <FundingBar progress={listing.fundingProgressRatio} funded={listing.fundingProgressRatio >= 1} />
            <div
              className="flex h-[44px] items-center justify-center gap-1.5 rounded-[10px] bg-surface-2 text-sm font-semibold text-foreground"
              data-testid="featured-cta"
            >
              {t("viewEstate")}
              <ChevronRight size={16} strokeWidth={2.25} aria-hidden />
            </div>
          </div>
        </Block>
      </Link>
    </section>
  );
}
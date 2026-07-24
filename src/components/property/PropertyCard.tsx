"use client";
// File responsibility: Marketplace listing card. DESIGN_SYSTEM "Property card (Marketplace)".
// Whole-card tap -> Property detail. Press scale 0.98 on :active. No drop shadow, no border.
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usd, weeklyRent, projectedYield, pct } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import type { Listing } from "@/types/property";
import { FundingBar } from "./FundingBar";
import { WeeklyYieldCallout } from "./WeeklyYieldCallout";

export function PropertyCard({ listing, variant = "list", className }: { listing: Listing; variant?: "list" | "mini"; className?: string }) {
  const weeklyPerShare = projectedYield(weeklyRent(listing.annualRentUsd), 1, listing.totalShares);
  const funded = listing.fundingProgressRatio >= 1;

  return (
    <Link
      href={ROUTES.property(listing.id)}
      className={cn(
        "block bg-card rounded-[12px] active:scale-[0.98] transition-transform duration-[120ms] ease-out",
        className,
      )}
    >
      {variant === "list" ? (
        <>
          {/* Phase 3: real <Image> lands when /public/images/properties has webp files. Placeholder bg-surface-2 div only — no <img> with a missing src. */}
          <div className="aspect-[16/10] rounded-t-[12px] bg-surface-2" aria-hidden>
            <span className="sr-only">{listing.title}</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <h2 className="text-[0.9375rem] font-semibold text-foreground leading-tight">{listing.title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{listing.location}</p>
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 text-xs">
              <div className="text-muted-foreground">Total</div>
              <div className="text-right text-foreground tnum">{usd(listing.sharePriceUsd * listing.totalShares)}</div>
              <div className="text-muted-foreground">Per share</div>
              <div className="text-right text-foreground tnum">{usd(listing.sharePriceUsd)}</div>
            </div>
            <WeeklyYieldCallout weeklyPerShare={weeklyPerShare} />
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{listing.status === "resale" ? "Resale" : "Funded"}</span>
                <span className="text-xs text-foreground tnum">{pct(listing.fundingProgressRatio)}</span>
              </div>
              <FundingBar progress={listing.fundingProgressRatio} funded={funded} />
            </div>
          </div>
        </>
      ) : (
        // mini variant (Home my-properties row) — used by Task 6 Home only; not rendered in Task 2.
        <div className="flex items-center gap-3 p-4">
          <div className="size-12 rounded-[10px] bg-surface-2 shrink-0" aria-hidden />
          <div className="flex-1 min-w-0">
            <h2 className="text-[0.9375rem] font-semibold text-foreground truncate">{listing.title}</h2>
            <p className="text-xs text-muted-foreground truncate tnum">{listing.totalShares} shares total</p>
            <div className="mt-1">
              <WeeklyYieldCallout weeklyPerShare={weeklyPerShare} />
            </div>
          </div>
        </div>
      )}
    </Link>
  );
}
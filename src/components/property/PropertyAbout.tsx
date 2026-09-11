"use client";
// File responsibility: About blurb + "More details" bottom sheet (REDESIGN-SPEC Phase 5,
// PROMPT 04 Matrix Detail truth reference).
// Data reconciliation: descriptive copy is the canonical full description via the
// view-model (seasonality/qualitative notes travel as the secondary narrative fact) —
// legacy fixture city copy must never render. Location, type, size, nightly rate,
// valuation and growth render approved canonical values verbatim (or pending);
// year/lease/rental-status have no approved source → labeled pending rows
// (labels kept as the collection backlog, values never invented).
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Listing } from "@/types/property";
import { unavailableLabel } from "@/lib/availability";
import { usd } from "@/lib/format";
import {
  formatValuationDisplayShort,
  type GrowthPotential,
  type ValuationDisplay,
} from "@/lib/economics/estates/growth-potential";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { Sheet } from "@/components/common/Sheet";
import { ProvenanceInfo } from "@/components/common/ProvenanceInfo";

export function PropertyAbout({
  listing,
  aboutText,
  sizeText,
  displayName,
  propertyType,
  descriptionFull,
  location,
  nightlyDisplay,
  valuationDisplay,
  growthPotential,
  listingId,
}: {
  listing: Listing;
  /** Approved narrative copy (research seasonality); null only without a canonical record (tests). */
  aboutText: string | null;
  /** Approved size text (units included) or null when the dataset is UNKNOWN. */
  sizeText: string | null;
  /** Canonical Estate24 name for the sheet heading; fallback listing title. */
  displayName?: string | null;
  /** Canonical source-supported property type; null → pending (never a legacy fixture type). */
  propertyType?: string | null;
  /** Canonical full description (Detail primary); null → seasonality/fixture fallback. */
  descriptionFull?: string | null;
  /** Canonical location full string; null → pending. */
  location?: string | null;
  /** Canonical observed nightly display verbatim; null → pending. */
  nightlyDisplay?: string | null;
  /** Current Estimated Value display (Grand range); null → pending. */
  valuationDisplay?: ValuationDisplay | null;
  /** Growth Potential (estimated); null → row omitted (conditional). */
  growthPotential?: GrowthPotential | null;
  /** Rental Escapes listing ID verbatim; null → row omitted (conditional). */
  listingId?: string | null;
}) {
  const t = useTranslations("property");
  const [open, setOpen] = useState(false);
  const pending = unavailableLabel("backend_absent");
  // Matrix Detail: full description is the primary reference copy; seasonality
  // stays as the secondary narrative fact (both canonical, never the fixture).
  const primaryCopy = descriptionFull ?? aboutText ?? listing.description;
  const secondaryCopy =
    descriptionFull != null && aboutText != null && aboutText !== descriptionFull
      ? aboutText
      : null;
  return (
    <Block className="space-y-2 p-4" data-testid="property-about">
      <h2 className="text-[0.9375rem] font-semibold leading-snug text-foreground">{t("about")}</h2>
      <p className="line-clamp-3 pb-0.5 text-sm leading-relaxed text-muted-foreground">
        {primaryCopy}
      </p>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center text-sm font-medium text-primary"
        data-testid="about-more"
      >
        {t("moreDetails")}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} labelledBy="about-sheet-title">
        <h3 id="about-sheet-title" className="text-base font-semibold text-foreground">
          {displayName ?? listing.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{primaryCopy}</p>
        {secondaryCopy ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{secondaryCopy}</p>
        ) : null}
        <div className="mt-4 rounded-[12px] bg-surface-2" data-testid="about-details">
          <div className="p-1">
            <Row>
              <span className="text-sm text-muted-foreground">{t("buySummaryLocation")}</span>
              <span className="ml-auto max-w-[60%] truncate text-sm text-foreground" data-testid="about-location">
                {location ?? pending}
              </span>
            </Row>
            <Row>
              <span className="text-sm text-muted-foreground">{t("typeLabel")}</span>
              <span className="ml-auto text-sm text-foreground" data-testid="about-type">
                {propertyType ?? pending}
              </span>
            </Row>
            <Row>
              <span className="text-sm text-muted-foreground">{t("sizeLabel")}</span>
              <span className="ml-auto text-sm tnum text-foreground" data-testid="about-size">
                {sizeText ?? pending}
              </span>
            </Row>
            <Row>
              <span className="text-sm text-muted-foreground">{t("rentalStoryNightlyRate")}</span>
              <span className="ml-auto flex min-w-0 items-center gap-1.5" data-testid="about-nightly">
                {nightlyDisplay != null ? (
                  <>
                    {/* Slice 7: bidi isolation for $-ranges in RTL locales. */}
                    <span dir="ltr" className="truncate text-sm tnum font-medium text-foreground">
                      {nightlyDisplay}
                    </span>
                    <ProvenanceInfo provenance="observed" />
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">{pending}</span>
                )}
              </span>
            </Row>
            <Row>
              <span className="text-sm text-muted-foreground">{t("estateValue")}</span>
              <span className="ml-auto flex min-w-0 items-center gap-1.5" data-testid="about-valuation">
                {valuationDisplay != null ? (
                  <>
                    <span className="text-sm tnum font-medium text-foreground">
                      {formatValuationDisplayShort(valuationDisplay)}
                    </span>
                    <ProvenanceInfo provenance={valuationDisplay.provenance} />
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">{pending}</span>
                )}
              </span>
            </Row>
            {growthPotential != null ? (
              <Row>
                <span className="text-sm text-muted-foreground">{t("growthPotentialTitle")}</span>
                <span className="ml-auto flex min-w-0 items-center gap-1.5" data-testid="about-growth">
                  <span className="text-sm tnum font-medium text-foreground">
                    {usd(growthPotential.potentialValue)}
                  </span>
                  <ProvenanceInfo provenance={growthPotential.provenance} />
                </span>
              </Row>
            ) : null}
            {listingId != null ? (
              <Row>
                <span className="text-sm text-muted-foreground">Listing ID</span>
                <span className="ml-auto text-sm tnum text-foreground" data-testid="about-listing-id">
                  {listingId}
                </span>
              </Row>
            ) : null}
            <Row>
              <span className="text-sm text-muted-foreground">{t("yearBuilt")}</span>
              <span className="ml-auto text-sm tnum text-foreground" data-testid="about-year">
                {pending}
              </span>
            </Row>
            <Row>
              <span className="text-sm text-muted-foreground">{t("rentalStatusLabel")}</span>
              <span className="ml-auto text-sm capitalize text-foreground" data-testid="about-rental-status">
                {pending}
              </span>
            </Row>
            <Row>
              <span className="text-sm text-muted-foreground">{t("leaseUntil")}</span>
              <span className="ml-auto text-sm tnum text-foreground" data-testid="about-lease">
                {pending}
              </span>
            </Row>
          </div>
        </div>
        {growthPotential != null ? (
          <p className="mt-3 text-[0.6875rem] leading-relaxed text-muted-foreground" data-testid="about-growth-note">
            {t("growthPotentialNote")}
          </p>
        ) : null}
      </Sheet>
    </Block>
  );
}

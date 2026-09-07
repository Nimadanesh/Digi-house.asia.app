"use client";
// File responsibility: About blurb + "More details" bottom sheet (REDESIGN-SPEC Phase 5).
// Data reconciliation: descriptive copy comes from the approved research layer
// (seasonality/qualitative notes) via the view-model — legacy fixture city copy
// must never render. Size renders the approved dataset text verbatim (or pending);
// year/type/lease/rental-status have no approved source → labeled pending rows
// (labels kept as the collection backlog, values never invented).
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Listing } from "@/types/property";
import { unavailableLabel } from "@/lib/availability";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { Sheet } from "@/components/common/Sheet";

export function PropertyAbout({
  listing,
  aboutText,
  sizeText,
  displayName,
}: {
  listing: Listing;
  /** Approved descriptive copy; null only without a canonical record (tests). */
  aboutText: string | null;
  /** Approved size text (units included) or null when the dataset is UNKNOWN. */
  sizeText: string | null;
  /** Canonical Estate24 name for the sheet heading; fallback listing title. */
  displayName?: string | null;
}) {
  const t = useTranslations("property");
  const [open, setOpen] = useState(false);
  const pending = unavailableLabel("backend_absent");
  return (
    <Block className="space-y-2 p-4" data-testid="property-about">
      <h2 className="text-[0.9375rem] font-semibold leading-snug text-foreground">{t("about")}</h2>
      <p className="line-clamp-3 pb-0.5 text-sm leading-relaxed text-muted-foreground">
        {aboutText ?? listing.description}
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
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{aboutText ?? listing.description}</p>
        <div className="mt-4 rounded-[12px] bg-surface-2" data-testid="about-details">
          <div className="p-1">
            <Row>
              <span className="text-sm text-muted-foreground">{t("sizeLabel")}</span>
              <span className="ml-auto text-sm tnum text-foreground" data-testid="about-size">
                {sizeText ?? pending}
              </span>
            </Row>
            <Row>
              <span className="text-sm text-muted-foreground">{t("yearBuilt")}</span>
              <span className="ml-auto text-sm tnum text-foreground" data-testid="about-year">
                {pending}
              </span>
            </Row>
            <Row>
              <span className="text-sm text-muted-foreground">{t("typeLabel")}</span>
              <span className="ml-auto text-sm text-foreground" data-testid="about-type">
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
      </Sheet>
    </Block>
  );
}

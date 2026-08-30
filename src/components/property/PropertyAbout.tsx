"use client";
// File responsibility: About blurb + "More details" bottom sheet (REDESIGN-SPEC Phase 5).
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Listing } from "@/types/property";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { Sheet } from "@/components/common/Sheet";

export function PropertyAbout({ listing }: { listing: Listing }) {
  const t = useTranslations("property");
  const [open, setOpen] = useState(false);
  const { meta } = listing;
  return (
    <Block className="space-y-2 p-4" data-testid="property-about">
      <h2 className="text-[0.9375rem] font-semibold leading-snug text-foreground">{t("about")}</h2>
      <p className="line-clamp-3 pb-0.5 text-sm leading-relaxed text-muted-foreground">
        {listing.description}
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
          {listing.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{listing.description}</p>
        <div className="mt-4 rounded-[12px] bg-surface-2" data-testid="about-details">
          <div className="p-1">
            <Row>
              <span className="text-sm text-muted-foreground">{t("sizeLabel")}</span>
              <span className="ml-auto text-sm tnum text-foreground">{meta.sizeSqm} m²</span>
            </Row>
            <Row>
              <span className="text-sm text-muted-foreground">{t("yearBuilt")}</span>
              <span className="ml-auto text-sm tnum text-foreground">{meta.yearBuilt}</span>
            </Row>
            <Row>
              <span className="text-sm text-muted-foreground">{t("typeLabel")}</span>
              <span className="ml-auto text-sm text-foreground">{meta.propertyType}</span>
            </Row>
            <Row>
              <span className="text-sm text-muted-foreground">{t("rentalStatusLabel")}</span>
              <span className="ml-auto text-sm capitalize text-foreground">{meta.rentalStatus}</span>
            </Row>
            {meta.leaseUntil ? (
              <Row>
                <span className="text-sm text-muted-foreground">{t("leaseUntil")}</span>
                <span className="ml-auto text-sm tnum text-foreground">{meta.leaseUntil}</span>
              </Row>
            ) : null}
          </div>
        </div>
      </Sheet>
    </Block>
  );
}

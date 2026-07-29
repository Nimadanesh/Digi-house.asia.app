"use client";
// File responsibility: About blurb + expandable facts accordion (Fable §About).
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Listing } from "@/types/property";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";

export function PropertyAbout({ listing }: { listing: Listing }) {
  const [open, setOpen] = useState(false);
  const { meta } = listing;
  return (
    <Block data-testid="property-about">
      <div className="space-y-2 p-4 pb-3.5">
        <h2 className="text-[0.9375rem] font-semibold leading-snug text-foreground">About</h2>
        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3 pb-0.5">
          {listing.description}
        </p>
      </div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between min-h-[48px] px-4 border-t border-border text-sm font-medium text-primary active:bg-surface-2/60"
      >
        {open ? "Hide details" : "More details"}
        <ChevronDown
          size={18}
          strokeWidth={1.75}
          className={cn("transition-transform duration-200 ease-out", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <div data-testid="about-details">
          <Row>
            <span className="text-sm text-muted-foreground">Size</span>
            <span className="ml-auto text-sm tnum text-foreground">{meta.sizeSqm} m²</span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">Year built</span>
            <span className="ml-auto text-sm tnum text-foreground">{meta.yearBuilt}</span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="ml-auto text-sm text-foreground">{meta.propertyType}</span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">Rental status</span>
            <span className="ml-auto text-sm text-foreground capitalize">{meta.rentalStatus}</span>
          </Row>
        </div>
      ) : null}
    </Block>
  );
}

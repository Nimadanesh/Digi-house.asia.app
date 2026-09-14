"use client";
// File responsibility: Estate tab §1 — "Why this estate" (structure §4.1 +
// revision contract): a highlighted card (softer surface) with the PO-supplied
// one-line headline, a max-two-line body, and up to four highlight points in
// the shared IconPointsGrid. Copy comes from the approved editorial layer
// (estate-editorial.ts); villas without approved editorial fall back to their
// adopted dataset description + derived highlights. The villa name is never
// repeated here. Presentational only.
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { EstateHighlight } from "@/types/estate-page-data";
import { Block } from "@/components/common/Block";
import { IconPointsGrid } from "@/components/property/IconPointsGrid";

export function EstateWhySection({
  descriptionShort,
  editorialHeadline,
  editorialBody,
  highlights,
}: {
  /** Adopted dataset short description (fallback body). */
  descriptionShort: string | null;
  /** PO-approved headline; null → fallback presentation (no hero card tint). */
  editorialHeadline: string | null;
  /** PO-approved body; null → the dataset description is the body. */
  editorialBody: string | null;
  /** Derived or editorial highlight points (max 4). */
  highlights: readonly EstateHighlight[];
}) {
  const t = useTranslations("property");
  if (editorialHeadline == null && descriptionShort == null) return null;
  return (
    <section className="space-y-2" data-testid="estate-why">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("estateWhyTitle")}
      </h2>
      <Block
        className={
          editorialHeadline != null
            ? "bg-surface-2 p-4"
            : "p-4"
        }
        data-testid="estate-why-card"
      >
        {editorialHeadline != null ? (
          <p className="text-[0.9375rem] font-medium leading-snug text-foreground">
            {editorialHeadline}
          </p>
        ) : null}
        <p className="pt-1 text-sm leading-relaxed text-muted-foreground">
          {editorialBody ?? descriptionShort}
        </p>
        {highlights.length > 0 ? (
          <div className="pt-3">
            <IconPointsGrid
              points={highlights.map((h) => ({
                id: h.id,
                label: h.label,
                icon: <Check size={16} strokeWidth={2.25} className="text-success" />,
              }))}
              columns={2}
              truncateLabels={false}
            />
          </div>
        ) : null}
      </Block>
    </section>
  );
}

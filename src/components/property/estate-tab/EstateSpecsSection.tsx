"use client";
// File responsibility: Estate tab §2 — Key Specs (structure §4.2 + revision
// contract): clean two-column FactRows from the adopted Estate24 record.
// Rows WITHOUT a real data source (year built, rental status, lease until)
// are NOT rendered at all — no pending filler. Size renders two lines
// (total on top; interior/pool smaller underneath) from the structured
// specs — never the duplicated combined string. Presentational only.
import { useTranslations } from "next-intl";
import type { Estate24Record } from "@/types/estate-24-data";
import { Block } from "@/components/common/Block";
import { FactRow } from "@/components/common/FactRow";

export function EstateSpecsSection({
  record,
  propertyType,
}: {
  /** Adopted Estate24 record (specs source); null renders nothing. */
  record: Estate24Record | null;
  /** Canonical property type; null → row omitted (never invented). */
  propertyType: string | null;
}) {
  const t = useTranslations("property");
  if (record == null) return null;
  const s = record.specs;
  return (
    <section className="space-y-2" data-testid="estate-specs">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("estateSpecsTitle")}
      </h2>
      <Block className="p-4">
        {propertyType != null ? <FactRow label={t("typeLabel")} value={propertyType} /> : null}
        {s.sizeTotalM2 != null ? (
          <FactRow
            label={t("sizeLabel")}
            value={`${s.sizeTotalM2} m² total`}
            caption={
              s.sizeInteriorM2 != null
                ? `${s.sizeInteriorM2} m² interior${s.poolM2 != null && s.poolM2 > 0 ? ` · ${s.poolM2} m² pool` : ""}`
                : null
            }
          />
        ) : null}
        <FactRow label={t("specBedrooms")} value={String(s.bedrooms)} />
        <FactRow label={t("specBathrooms")} value={String(s.bathrooms)} />
        <FactRow label={t("specGuests")} value={String(s.guests)} />
      </Block>
    </section>
  );
}

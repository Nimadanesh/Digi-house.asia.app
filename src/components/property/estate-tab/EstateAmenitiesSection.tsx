"use client";
// File responsibility: Estate tab §3 — Amenities (structure §4.3 + revision
// contract): the premium amenity lists from the adopted Estate24 record in an
// icon grid (2 columns mobile / 3 from sm up), first 10 shown with the rest
// behind "Show more". Labels are verbatim dataset strings rendered in full
// (no truncation); no amenity is invented. Absent lists render nothing.
import { Bike, ChefHat, Dumbbell, Sparkles, Tv, Waves, Wifi, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import type { Estate24Record } from "@/types/estate-24-data";
import { Block } from "@/components/common/Block";

const VISIBLE_CAP = 10;

function amenityIcon(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (l.includes("pool") || l.includes("jacuzzi")) return Waves;
  if (l.includes("chef") || l.includes("kitchen")) return ChefHat;
  if (l.includes("gym") || l.includes("fitness")) return Dumbbell;
  if (l.includes("wi-fi") || l.includes("wifi") || l.includes("internet")) return Wifi;
  if (l.includes("tv") || l.includes("cinema") || l.includes("theater")) return Tv;
  if (l.includes("bike") || l.includes("tennis") || l.includes("golf")) return Bike;
  if (l.includes("air") || l.includes("climate")) return Wind;
  return Sparkles;
}

export function EstateAmenitiesSection({ record }: { record: Estate24Record | null }) {
  const t = useTranslations("property");
  const capId = useId();
  const [showAll, setShowAll] = useState(false);
  if (record == null) return null;
  const labels = [
    ...record.amenities.general,
    ...record.amenities.outdoor,
    ...record.amenities.indoor,
  ];
  if (labels.length === 0) return null;
  const visible = showAll ? labels : labels.slice(0, VISIBLE_CAP);
  return (
    <section className="space-y-2" data-testid="estate-amenities">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("estateAmenitiesTitle")}
      </h2>
      <Block className="p-4 shadow-sm ring-1 ring-border/50 sm:p-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3" data-testid="icon-points-grid">
          {visible.map((label) => {
            const Icon = amenityIcon(label);
            return (
              <div
                key={`${capId}-${label}`}
                className="flex min-w-0 items-center gap-2.5"
                data-testid="icon-points-grid-point"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2/60 text-muted-foreground [&>svg]:block"
                  aria-hidden
                >
                  <Icon size={15} strokeWidth={1.75} />
                </span>
                <span className="min-w-0 text-[0.8125rem] font-medium leading-snug text-foreground/90">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        {labels.length > VISIBLE_CAP ? (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-4 inline-flex min-h-[44px] items-center text-sm font-medium text-primary transition-all duration-150 ease-out hover:text-primary/80 active:scale-[0.98]"
            data-testid="estate-amenities-toggle"
          >
            {showAll
              ? t("amenitiesShowLess")
              : t("amenitiesShowMore", { count: labels.length - VISIBLE_CAP })}
          </button>
        ) : null}
      </Block>
    </section>
  );
}

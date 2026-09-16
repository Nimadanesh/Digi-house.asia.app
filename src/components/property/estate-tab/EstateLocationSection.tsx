"use client";
// File responsibility: Estate tab §4 — Location (structure §4.4 + revision
// contract): the locked D7 location detail — big location title, Island /
// Region rows, the airport transfer as a collapsed expandable row (value =
// status + leading duration, detail = the locked transfer text), and the
// PROTECTED Reserve CTA (official Rental Escapes link) closing the card.
// No map asset exists yet — text-only. Absent detail renders nothing.
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { EstateLocationDetail } from "@/types/estate-page-data";
import { Block } from "@/components/common/Block";
import { FactRow } from "@/components/common/FactRow";
import { ReserveVillaCta } from "@/components/property/ReserveVillaCta";

/** Leading duration of a locked transfer text, e.g. "40-min seaplane…" → 40. */
function leadingDurationMinutes(text: string): number | null {
  const match = text.match(/(\d+)\s*[-–]?\s*min/i);
  return match ? Number(match[1]) : null;
}

export function EstateLocationSection({
  detail,
  reserveUrl,
}: {
  /** Locked D7 location detail; null renders nothing. */
  detail: EstateLocationDetail | null;
  /** Official Rental Escapes URL (protected CTA target). */
  reserveUrl: string | null;
}) {
  const t = useTranslations("property");
  const [transferOpen, setTransferOpen] = useState(false);
  if (detail == null) return null;
  const minutes = leadingDurationMinutes(detail.transfer.text);
  const statusLabel =
    detail.transfer.status === "APPROX" ? t("transferStatusApprox") : t("transferStatusConfirmed");
  // Revision contract: the resort name appears ONCE. Derive the plain resort
  // name ("JOALI Being (68 villas, …)" → "JOALI Being"), strip it from the
  // location title, and render the resort row as name · details.
  const resortName = detail.islandOrResort.replace(/\s*\(.*\)\s*$/, "").trim();
  const resortDetails = detail.islandOrResort.match(/\((.*)\)\s*$/)?.[1] ?? null;
  const resortRow = resortDetails
    ? `${resortName} · ${resortDetails.replace(/,\s*/g, " · ")}`
    : detail.islandOrResort;
  const titleText = detail.locationText.startsWith(`${resortName},`)
    ? detail.locationText.slice(resortName.length + 1).trim()
    : detail.locationText;
  return (
    <section className="space-y-2" data-testid="estate-location">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("estateLocationTitle")}
      </h2>
      <Block className="overflow-hidden p-4 shadow-sm ring-1 ring-border/50 sm:p-5" data-testid="estate-location-card">
        <p className="text-[0.9375rem] font-semibold leading-snug tracking-[-0.01em] text-foreground">{titleText}</p>
        <div className="pt-1">
          <FactRow label={t("estateLocationResort")} value={resortRow} wrapValue />
          <FactRow label={t("estateLocationRegion")} value={detail.region} />
          <button
            type="button"
            onClick={() => setTransferOpen((v) => !v)}
            aria-expanded={transferOpen}
            aria-controls="estate-location-transfer-detail"
            className="flex min-h-[44px] w-full items-center justify-between gap-2 py-1 text-start transition-transform duration-150 ease-out active:scale-[0.99]"
            data-testid="estate-location-transfer-toggle"
          >
            <span className="min-w-0 truncate text-sm text-muted-foreground">
              {t("estateLocationTransfer")}
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              <span
                className={cn(
                  "whitespace-nowrap text-sm tnum font-semibold",
                  detail.transfer.status === "APPROX" ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {statusLabel}
                {minutes != null ? ` · ~${minutes} min` : ""}
              </span>
              <ChevronDown
                size={16}
                strokeWidth={1.75}
                aria-hidden
                className={cn(
                  "text-muted-foreground transition-transform duration-150 ease-out",
                  transferOpen ? "rotate-180" : "",
                )}
              />
            </span>
          </button>
          {transferOpen ? (
            <div
              id="estate-location-transfer-detail"
              className="rounded-[10px] bg-surface-2/50 px-3 py-2"
              data-testid="estate-location-transfer"
            >
              <p className="text-xs leading-relaxed text-muted-foreground">{detail.transfer.text}</p>
              {detail.highlight ? (
                <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
                  {detail.highlight}
                </p>
              ) : null}
              {detail.note ? (
                <p className="pt-1 text-xs leading-relaxed text-muted-foreground">{detail.note}</p>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="border-t border-border/50 pt-3">
          <ReserveVillaCta url={reserveUrl} />
        </div>
      </Block>
    </section>
  );
}

"use client";
// File responsibility: Details tab §1 — Management & Operator (structure §7.1
// + revision contract): a horizontal card — Rental Escapes identity line, the
// villa's assigned Villa Specialist (local avatar → fullscreen lightbox on
// tap, name, title), the bio clamped to 3 lines with Show more/less, and the
// locked contact rows. All content is CONFIRMED locked data (D1); nothing is
// authored here. Absent assignment renders the section honestly empty.
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { getOperatorAssignmentByPropertyId } from "@/lib/economics/estates/operator-24";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";
import { Block } from "@/components/common/Block";
import { FactRow } from "@/components/common/FactRow";
import { ImageLightbox } from "./ImageLightbox";

/** Bios render 3 lines by default; longer bios get the expand toggle. */
const BIO_CLAMP_CHARS = 220;

export function OperatorSection({ propertyId }: { propertyId: string }) {
  const t = useTranslations("property");
  const [photoOpen, setPhotoOpen] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);
  const assignment = getOperatorAssignmentByPropertyId(propertyId);
  if (assignment == null) return null;
  const { company, specialist } = assignment;
  return (
    <section className="space-y-2" data-testid="details-operator">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("operatorTitle")}
      </h2>
      <Block className="p-4" data-testid="details-operator-card">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[0.9375rem] font-semibold text-foreground">
            {company.name
              .split(" ")
              .map((word) => word[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{company.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {company.kind} · {company.portfolioClaim}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 pt-3">
          <button
            type="button"
            onClick={() => {
              haptics.selection();
              setPhotoOpen(true);
            }}
            aria-label={t("operatorPhotoAria", { name: specialist.fullName })}
            className="shrink-0 rounded-full transition-transform duration-[120ms] ease-out active:scale-[0.96]"
            data-testid="details-operator-photo-trigger"
          >
            <Image
              src={specialist.photoUrl}
              alt={specialist.fullName}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
              data-testid="details-operator-photo"
            />
          </button>
          <div className="min-w-0">
            <p
              className="truncate text-sm font-semibold text-foreground"
              data-testid="details-operator-name"
            >
              {specialist.fullName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{specialist.title}</p>
          </div>
        </div>
        <div className="pt-2" data-testid="details-operator-bio">
          <p
            className={cn(
              "text-xs leading-relaxed text-muted-foreground",
              !bioOpen && specialist.bio.length > BIO_CLAMP_CHARS && "line-clamp-3",
            )}
            data-testid="details-operator-bio-text"
          >
            {specialist.bio}
          </p>
          {specialist.bio.length > BIO_CLAMP_CHARS ? (
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                setBioOpen((v) => !v);
              }}
              className="mt-0.5 text-xs font-medium text-primary"
              data-testid="details-operator-bio-toggle"
            >
              {bioOpen ? t("documentsShowLess") : t("bioShowMore")}
            </button>
          ) : null}
        </div>
        <div className="pt-2">
          <FactRow label={t("operatorPhone")} value={company.phone} />
          <FactRow label={t("operatorEmail")} value={company.email} />
        </div>
      </Block>

      {photoOpen ? (
        <ImageLightbox src={specialist.photoUrl} alt={specialist.fullName} onClose={() => setPhotoOpen(false)} />
      ) : null}
    </section>
  );
}

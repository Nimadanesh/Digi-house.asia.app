// File responsibility: Owner Stay P0 preview card (Phase 9 UI Mapping §9). PRESENTATION
// ONLY — no booking, no calendar, no availability engine. Data is UNAVAILABLE today
// (mock stay repo returns backend_absent), so owners see honest explainer copy with a
// disabled "View Owner Calendar" CTA; non-owners see the privilege explainer.
// The stay snapshot comes from the Slice 1 StayRepo contract via useStay.
import { useTranslations } from "next-intl";
import { BedDouble } from "lucide-react";
import type { Listing } from "@/types/property";
import type { EstateStayInfo } from "@/types/stay";
import { unavailableLabel } from "@/lib/availability";
import { Block } from "@/components/common/Block";

export function OwnerStayCard({
  ownedShares,
  stay,
}: {
  /** Retained for type symmetry — ownership state drives the copy. */
  listing?: Listing;
  ownedShares: number;
  /** Slice 1 stay snapshot — honest unavailable state until a real source exists. */
  stay?: EstateStayInfo;
}) {
  const t = useTranslations("property");
  const isOwner = ownedShares > 0;

  return (
    <section className="space-y-2" data-testid="owner-stay-card">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("ownerStayTitle")}
      </h2>
      <Block className="space-y-3 p-4">
        <div className="flex items-start gap-2.5">
          <BedDouble size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-sm leading-relaxed text-foreground">
            {isOwner ? t("ownerStayOwnerIntro") : t("ownerStayNonOwner")}
          </p>
        </div>

        {isOwner ? (
          <div className="space-y-3">
            {/* Availability is UNAVAILABLE (Slice 1 semantics) — honest chip, no number. */}
            <span
              className="inline-flex rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted-foreground"
              data-testid="owner-stay-availability"
            >
              {unavailableLabel(stay?.unavailableReason ?? "backend_absent")}
            </span>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("ownerStayEntitlementPending")}
            </p>
            <button
              type="button"
              disabled
              className="flex h-[46px] w-full items-center justify-center rounded-[12px] bg-surface-2 text-sm font-semibold text-muted-foreground"
              data-testid="owner-stay-calendar-cta"
            >
              {t("ownerStayCalendarCta")}
            </button>
            <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
              {t("ownerStayRequestNote")}
            </p>
          </div>
        ) : null}
      </Block>
    </section>
  );
}

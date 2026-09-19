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
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("ownerStayTitle")}
      </h2>
      <Block className="space-y-3 rounded-[12px] p-5 shadow-sm ring-1 ring-border/50">
        <div className="flex items-center gap-2.5">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2/60 text-muted-foreground ring-1 ring-border/40 [&>svg]:block"
            aria-hidden
          >
            <BedDouble size={15} strokeWidth={1.75} />
          </span>
          <p className="line-clamp-2 min-w-0 text-[0.84375rem] font-medium leading-snug tracking-[-0.01em] text-foreground">
            {isOwner ? t("ownerStayOwnerIntro") : t("ownerStayNonOwner")}
          </p>
        </div>

        {isOwner ? (
          <div className="space-y-3">
            {/* Availability is UNAVAILABLE (Slice 1 semantics) — honest chip, no number. */}
            <span
              className="inline-flex items-center whitespace-nowrap rounded-full bg-surface-2/60 px-2.5 py-[5px] text-[0.6875rem] font-semibold leading-none tracking-wide text-muted-foreground ring-1 ring-border/50"
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
              className="flex h-[44px] w-full items-center justify-center rounded-[12px] bg-surface-2 text-sm font-semibold text-muted-foreground ring-1 ring-border/50"
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

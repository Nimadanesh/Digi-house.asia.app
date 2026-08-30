"use client";
// File responsibility: ownership banner — reflects the user's position on THIS property
// and offers "Lock shares to start earning" when unlocked shares are available
// (REDESIGN-SPEC Phase 6). Hidden entirely while ownership is unknown/zero.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import type { Listing } from "@/types/property";
import { haptics } from "@/lib/telegram/haptics";
import { Block } from "@/components/common/Block";
import { LockSheet } from "./LockSheet";

export function OwnershipBanner({
  listing,
  ownedShares,
  lockedShares,
  avgCostUsd,
}: {
  listing: Listing;
  ownedShares: number;
  lockedShares: number;
  /** Holder's average cost for the principal preview; defaults to list price. */
  avgCostUsd?: number;
}) {
  const t = useTranslations("property");
  const [sheetOpen, setSheetOpen] = useState(false);
  const freeShares = Math.max(0, ownedShares - lockedShares);

  // State 1 (owns nothing) or still resolving → no banner; page stays buy-focused.
  if (ownedShares <= 0) return null;

  const fullyLocked = freeShares === 0;

  return (
    <>
      <Block className="space-y-3 border border-success/25 p-4" data-testid="ownership-banner">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground tnum" data-testid="ownership-copy">
            {t("youOwn", {
              count: ownedShares,
              unit: ownedShares === 1 ? t("shareWord") : t("sharesWord"),
              locked: lockedShares,
            })}
          </p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
              fullyLocked ? "bg-success/12 text-success" : "bg-warning/12 text-warning"
            }`}
            data-testid="ownership-state"
          >
            {fullyLocked ? t("earningNow") : t("notEarningYet")}
          </span>
        </div>
        {!fullyLocked ? (
          <>
            <button
              type="button"
              onClick={() => {
                haptics.impact("light");
                setSheetOpen(true);
              }}
              className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground transition-transform duration-[120ms] ease-out active:scale-[0.98]"
              data-testid="banner-lock"
            >
              <Lock size={16} strokeWidth={1.75} />
              {t("bannerLockCta")}
            </button>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("bannerLockNote")}
            </p>
          </>
        ) : null}
      </Block>

      {/* Sheet mounts only while open (G10) — hooks/state initialize fresh. */}
      {sheetOpen ? (
        <LockSheet
          open
          onClose={() => setSheetOpen(false)}
          listing={listing}
          freeShares={freeShares}
          avgCostUsd={avgCostUsd ?? listing.sharePriceUsd}
        />
      ) : null}
    </>
  );
}

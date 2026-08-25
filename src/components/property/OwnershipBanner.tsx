"use client";
// File responsibility: ownership banner — reflects the user's position on THIS property
// and offers "Lock shares to start earning" when unlocked shares are available
// (REDESIGN-SPEC Phase 6). Hidden entirely while ownership is unknown/zero.
import { useState } from "react";
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
            You own {ownedShares} {ownedShares === 1 ? "share" : "shares"} · {lockedShares} locked
          </p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
              fullyLocked ? "bg-success/12 text-success" : "bg-warning/12 text-warning"
            }`}
            data-testid="ownership-state"
          >
            {fullyLocked ? "Earning" : "Not earning yet"}
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
              Lock shares to start earning
            </button>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Shares only earn yield while locked. Locking is free — unlock takes 2–3
              days if you change your mind.
            </p>
          </>
        ) : null}
      </Block>

      <LockSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        listing={listing}
        freeShares={freeShares}
        avgCostUsd={avgCostUsd ?? listing.sharePriceUsd}
      />
    </>
  );
}

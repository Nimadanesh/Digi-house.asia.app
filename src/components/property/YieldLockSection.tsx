"use client";
// File responsibility: Yield & lock section on Property detail (PRODUCT-PLAN §0.4 / PB-08).
// Shows the property's monthly yield rate, the user's locked/free position, lock rows
// with unlock requests, and hosts the Lock/Sell sheets. Redesign Phase 6: the sheet
// itself lives in LockSheet.tsx so other surfaces (ownership banner) can reuse it.
// Unlock is a consequential action: it opens a confirmation sheet (no direct mutation).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Lock, LockOpen, TrendingDown } from "lucide-react";
import type { Listing } from "@/types/property";
import type { ShareLock } from "@/types/lock";
import { usd } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useLocks, useRequestUnlock, activeLocksForProperty } from "@/hooks/useLocks";
import { Block } from "@/components/common/Block";
import { StatusPill } from "@/components/common/StatusPill";
import { ConfirmActionSheet } from "@/components/common/ConfirmActionSheet";
import { LockSheet } from "./LockSheet";
import { SellSheet } from "./SellSheet";

function LockRow({ lock, onUnlock, unlockPending }: {
  lock: ShareLock;
  /** Opens the unlock confirmation sheet — never mutates directly. */
  onUnlock: (lock: ShareLock) => void;
  unlockPending: boolean;
}) {
  const t = useTranslations("property");
  const matures = lock.maturesAt ? lock.maturesAt.slice(0, 10) : null;
  return (
    <Block className="p-4 space-y-3" data-testid={`lock-row-${lock.status}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Lock size={16} strokeWidth={1.75} className="shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground tnum">
            {t("nShares", { count: lock.shares })}
          </span>
        </div>
        {lock.status === "locked" ? (
          <StatusPill label={lock.payoutPeriod === "weekly" ? t("accruingWeekly") : t("accruingMonthly")} variant="success" />
        ) : (
          <StatusPill label={t("unlocksOn", { date: matures ?? t("unlockingInDays") })} variant="warning" />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
        <div>
          <div className="mb-1 text-[0.6875rem] leading-snug text-muted-foreground">{t("accruedUnpaidLabel")}</div>
          <div className="text-sm font-semibold tnum text-success">{usd(lock.accruedUnpaidUsd)}</div>
        </div>
        <div>
          <div className="mb-1 text-[0.6875rem] leading-snug text-muted-foreground">
            {lock.payoutPeriod === "weekly" ? t("perWeek") : t("perMonth")}
          </div>
          <div className="text-sm font-semibold tnum text-foreground">{usd(lock.installmentUsd)}</div>
        </div>
      </div>
      {lock.status === "locked" ? (
        <button
          type="button"
          disabled={unlockPending}
          onClick={() => {
            haptics.impact("light");
            onUnlock(lock);
          }}
          className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-transparent text-sm font-semibold text-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
        >
          <LockOpen size={16} strokeWidth={1.75} />
          {unlockPending ? t("requesting") : t("requestUnlock")}
        </button>
      ) : (
        <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
          {t("unlockPendingNote")}
        </p>
      )}
    </Block>
  );
}

export function YieldLockSection({ listing }: { listing: Listing }) {
  const t = useTranslations("property");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  /** Lock awaiting unlock confirmation — null = sheet closed. */
  const [unlockTarget, setUnlockTarget] = useState<ShareLock | null>(null);
  /** Unlock confirmation state machine: confirm → success. */
  const [unlockDone, setUnlockDone] = useState(false);
  const portfolio = usePortfolio();
  const locksQuery = useLocks();
  const unlock = useRequestUnlock();

  const holding = portfolio.data?.holdings.find((h) => h.propertyId === listing.id);
  const activeLocks = activeLocksForProperty(locksQuery.data?.locks, listing.id);
  const lockedShares = activeLocks.reduce((s, l) => s + l.shares, 0);
  const owned = holding?.sharesOwned ?? 0;
  const free = Math.max(0, owned - lockedShares);

  return (
    <section className="space-y-2" data-testid="yield-lock-section">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">{t("yieldSection")}</h2>
      <Block className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium text-foreground">{t("monthlyYield")}</div>
            <div className="mt-0.5 text-[0.6875rem] text-muted-foreground">
              {t("onLockedSharesNote")}
            </div>
          </div>
          <span className="rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-white tnum">
            {listing.monthlyYieldRate.toFixed(2)}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
          <div>
            <div className="mb-1 text-[0.6875rem] leading-snug text-muted-foreground">{t("yourShares")}</div>
            <div className="text-sm font-semibold tnum text-foreground">{owned}</div>
          </div>
          <div>
            <div className="mb-1 text-[0.6875rem] leading-snug text-muted-foreground">{t("freeToLock")}</div>
            <div className="text-sm font-semibold tnum text-foreground">{free}</div>
          </div>
        </div>

        {owned === 0 ? (
          <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
            {t("buyFirstNote")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={free === 0}
              onClick={() => {
                haptics.impact("light");
                setSheetOpen(true);
              }}
              className="flex h-[44px] items-center justify-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
              data-testid="open-lock-sheet"
            >
              <Lock size={16} strokeWidth={1.75} />
              {free === 0 ? t("allLocked") : t("lockCta")}
            </button>
            <button
              type="button"
              onClick={() => {
                haptics.impact("light");
                setSellOpen(true);
              }}
              className="flex h-[44px] items-center justify-center gap-2 rounded-[10px] border border-border bg-transparent px-4 text-sm font-semibold text-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out"
              data-testid="open-sell-sheet"
            >
              <TrendingDown size={16} strokeWidth={1.75} />
              {t("sell")}
            </button>
          </div>
        )}
      </Block>

      {activeLocks.map((lock) => (
        <LockRow
          key={lock.id}
          lock={lock}
          onUnlock={(target) => {
            setUnlockDone(false);
            setUnlockTarget(target);
          }}
          unlockPending={unlock.isPending && unlock.variables === lock.id}
        />
      ))}

      {/* Unlock is consequential (stops yield, 2–3 day wait) → confirm first, then mutate. */}
      <ConfirmActionSheet
        open={unlockTarget != null}
        onClose={() => setUnlockTarget(null)}
        title={t("unlockConfirmTitle")}
        description={t("unlockConfirmBody")}
        details={[
          { label: t("propertyLabel"), value: unlockTarget?.propertyTitle ?? listing.title },
          { label: t("sharesLabel"), value: unlockTarget?.shares ?? 0 },
          {
            label: t("payoutPeriodLabel"),
            value: unlockTarget?.payoutPeriod === "weekly" ? t("weeklyLabel") : t("monthlyLabel"),
          },
          {
            label: t("accruedUnpaidLabel"),
            value: usd(unlockTarget?.accruedUnpaidUsd ?? 0),
            valueClass: "text-success",
          },
        ]}
        confirmLabel={t("unlockConfirmCta")}
        pendingLabel={t("unlockPendingLabel")}
        pending={unlock.isPending}
        error={unlock.isError && unlock.error ? (unlock.error as Error).message : null}
        success={
          unlockDone
            ? {
                title: t("unlockSuccessTitle"),
                message: t("unlockSuccessBody"),
              }
            : null
        }
        onConfirm={() => {
          if (!unlockTarget || unlock.isPending) return;
          unlock.mutate(unlockTarget.id, { onSuccess: () => setUnlockDone(true) });
        }}
        testId="unlock-confirm"
      />

      {/* Sheets mount only while open (G10) — their hooks/state initialize fresh. */}
      {sheetOpen ? (
        <LockSheet
          open
          onClose={() => setSheetOpen(false)}
          listing={listing}
          freeShares={free}
          avgCostUsd={holding?.avgCostUsd ?? listing.sharePriceUsd}
        />
      ) : null}
      {sellOpen ? (
        <SellSheet
          open
          onClose={() => setSellOpen(false)}
          listing={listing}
          freeShares={free}
          avgCostUsd={holding?.avgCostUsd ?? listing.sharePriceUsd}
        />
      ) : null}
    </section>
  );
}

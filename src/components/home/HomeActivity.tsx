"use client";
// File responsibility: Home activity preview — header ("Activity" + "View all" to the
// existing /transactions route) plus at most ONE expandable next-payout capsule row
// (same gate Home used before: hidden when nothing is scheduled). No transaction
// cards here; every tx state still lives on /transactions.
import { useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { nextPayoutDate, formatPayoutDate } from "@/lib/payout-display";
import { useSharedNowMs } from "@/hooks/useSharedNowMs";
import { haptics } from "@/lib/telegram/haptics";
import { ROUTES } from "@/lib/constants";

const EXPAND_BEZIER = "cubic-bezier(0.23, 1, 0.32, 1)";

export function HomeActivity({
  projectedUsd,
  hasPayout,
}: {
  /** Existing expected amount, integer minor units (from the earnings repo contract). */
  projectedUsd: number;
  /** SAME gate Home used before: only true when a pending/next distribution exists. */
  hasPayout: boolean;
}) {
  const t = useTranslations("home");
  const nowMs = useSharedNowMs();
  const [expanded, setExpanded] = useState(false);
  const when = formatPayoutDate(nextPayoutDate(nowMs));

  return (
    <section className="space-y-2" data-testid="home-activity">
      <Link
        href={ROUTES.transactions}
        onClick={() => haptics.selection()}
        data-testid="activity-see-all"
        aria-label={`${t("activity")} — ${t("viewAll")}`}
        className="flex h-11 w-full items-center justify-between rounded-full border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.06)] px-4"
      >
        <span className="text-[15px] font-medium text-white">{t("activity")}</span>
        <span className="inline-flex items-center gap-0.5 text-[13px] font-medium text-[rgba(255,255,255,0.60)]">
          {t("viewAll")}
          <ChevronRight size={16} strokeWidth={2.25} aria-hidden className="rtl:rotate-180" />
        </span>
      </Link>
      {hasPayout ? (
        <div
          data-testid="payout-row"
          style={{
            borderRadius: expanded ? 14 : 22,
            transition: `border-radius 300ms ${EXPAND_BEZIER}`,
          }}
          className="w-full bg-[rgba(255,255,255,0.06)]"
        >
          <button
            type="button"
            onClick={() => {
              haptics.selection();
              setExpanded((v) => !v);
            }}
            aria-expanded={expanded}
            aria-controls="payout-row-details"
            data-testid="payout-row-toggle"
            className="flex h-11 w-full items-center gap-2.5 px-3"
          >
            <span className="flex size-6 shrink-0 items-center justify-center text-muted-foreground">
              <CalendarClock size={20} strokeWidth={1.75} aria-hidden />
            </span>
            <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground">
              {t("nextPayout")}
            </span>
            <span className="shrink-0 text-sm font-semibold tnum text-success" data-testid="payout-row-amount">
              {usd(projectedUsd)}
            </span>
            <span
              className="inline-flex shrink-0 items-center rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-semibold text-primary"
              data-testid="payout-row-status"
            >
              {t("expected")}
            </span>
            <ChevronDown
              size={16}
              strokeWidth={2.25}
              aria-hidden
              className="shrink-0 text-muted-foreground"
              style={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: `transform 300ms ${EXPAND_BEZIER}`,
              }}
            />
          </button>
          <div
            id="payout-row-details"
            style={{
              display: "grid",
              gridTemplateRows: expanded ? "1fr" : "0fr",
              opacity: expanded ? 1 : 0,
              transition: `grid-template-rows 300ms ${EXPAND_BEZIER}, opacity 300ms ${EXPAND_BEZIER}`,
            }}
            className="overflow-hidden"
          >
            <div className="min-h-0 overflow-hidden">
              <div className="ml-6 border-l border-[rgba(255,255,255,0.12)] pb-3 pl-3 pr-3">
                <div className="flex items-center justify-between gap-3 py-1.5">
                  <span className="text-[13px] text-muted-foreground">{t("payoutDate")}</span>
                  <span className="text-[13px] font-medium tnum text-foreground" data-testid="payout-detail-date">
                    {when}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 py-1.5">
                  <span className="text-[13px] text-muted-foreground">{t("payoutAmount")}</span>
                  <span className="text-[13px] font-semibold tnum text-foreground" data-testid="payout-detail-amount">
                    {usd(projectedUsd)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 py-1.5">
                  <span className="text-[13px] text-muted-foreground">{t("payoutStatus")}</span>
                  <span className="text-[13px] font-medium text-foreground" data-testid="payout-detail-status">
                    {t("expected")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

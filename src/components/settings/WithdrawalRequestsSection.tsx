"use client";
// File responsibility: Settings — USDT withdrawal request list (PE-02/PE-08). Row
// pattern with a StatusPill per state; presentational — the hooks are owned by the
// SettingsSheet body. Empty/loading/error states included.
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { SectionLabel } from "@/components/common/SectionLabel";
import { StatusPill } from "@/components/common/StatusPill";
import { Skeleton } from "@/components/common/Skeleton";
import { usd, timeAgo } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import type { Withdrawal, WithdrawalStatus } from "@/types/withdrawal";

type PillVariant = "success" | "warning" | "danger";

export function WithdrawalRequestsSection({
  withdrawals,
  loading = false,
  error = null,
  onRequest,
}: {
  withdrawals: Withdrawal[] | undefined;
  loading?: boolean;
  error?: string | null;
  /** Present → render the "Request withdrawal" row that opens the request sheet. */
  onRequest?: () => void;
}) {
  const t = useTranslations("settings");

  if (error) {
    return (
      <section className="space-y-2" data-testid="withdrawal-requests">
        <SectionLabel className="px-0.5">{t("withdrawalRequests")}</SectionLabel>
        <Block>
          <Row className="!min-h-[56px]">
            <span className="text-sm text-muted-foreground">{error}</span>
          </Row>
        </Block>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="space-y-2" data-testid="withdrawal-requests">
        <SectionLabel className="px-0.5">{t("withdrawalRequests")}</SectionLabel>
        <Block>
          {/* Skeletons mirror the final two-line row shape (amount + meta, pill right). */}
          <Row className="!min-h-[56px]">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </Row>
          <Row className="!min-h-[56px]">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </Row>
        </Block>
      </section>
    );
  }

  const rows = withdrawals ?? [];
  return (
    <section className="space-y-2" data-testid="withdrawal-requests">
      <SectionLabel className="px-0.5">{t("withdrawalRequests")}</SectionLabel>
      <Block>
        {onRequest ? (
          <button
            type="button"
            onClick={() => {
              haptics.selection();
              onRequest();
            }}
            className="flex w-full min-h-[56px] items-center gap-2 px-4 py-3.5 text-start active:bg-surface-2/60 active:scale-[0.98] transition-transform duration-[120ms] ease-out"
            data-testid="withdrawal-request-open"
          >
            <span className="flex-1 text-sm font-medium text-foreground">
              {t("withdrawalRequest")}
            </span>
            <Plus
              size={20}
              strokeWidth={1.75}
              className="shrink-0 text-primary"
              aria-hidden
            />
          </button>
        ) : null}
        {rows.length === 0 ? (
          <Row className="!min-h-[56px]">
            <span className="text-sm text-muted-foreground">
              {t("withdrawalRequestsEmpty")}
            </span>
          </Row>
        ) : (
          rows.map((w) => (
            <Row key={w.id} className="!min-h-[56px]">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold tnum text-foreground">
                  {usd(w.amountUsd)}
                </div>
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {timeAgo(w.createdAt)}
                </div>
              </div>
              <StatusPill label={statusLabel(t, w.status)} variant={STATUS_VARIANT[w.status]} />
            </Row>
          ))
        )}
      </Block>
    </section>
  );
}

const STATUS_VARIANT: Record<WithdrawalStatus, PillVariant> = {
  paid: "success",
  requested: "warning",
  approved: "warning",
  rejected: "danger",
};

function statusLabel(
  t: (key: string) => string,
  status: WithdrawalStatus,
): string {
  switch (status) {
    case "paid":
      return t("withdrawalStatusPaid");
    case "approved":
      return t("withdrawalStatusApproved");
    case "rejected":
      return t("withdrawalStatusRejected");
    default:
      return t("withdrawalStatusRequested");
  }
}

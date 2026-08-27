"use client";
// File responsibility: secondary Withdraw entry on Earnings (redesign) — reuses the existing
// WithdrawalRequestSheet flow (PE-08). One quiet row: withdrawable balance + chevron that opens
// the sheet. No new financial logic; balance comes from useMeSummary.
import { useState } from "react";
import { ChevronRight, ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { useMeSummary } from "@/hooks/useLocks";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { WithdrawalRequestSheet } from "@/components/settings/WithdrawalRequestSheet";

export function EarningsWithdrawEntry() {
  const t = useTranslations("earnings");
  const { data: summary } = useMeSummary();
  const [open, setOpen] = useState(false);
  const withdrawable = summary?.balances.withdrawableUsd ?? 0;

  return (
    <section className="space-y-2" data-testid="earnings-withdraw-entry">
      <Block data-testid="earnings-withdraw-block">
        <Row
          onClick={() => {
            haptics.selection();
            setOpen(true);
          }}
          className="min-h-[56px]"
          data-testid="earnings-withdraw-row"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-primary/12 text-primary">
            <ArrowUpRight size={20} strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("withdraw")}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground tnum">
              {t("withdrawSubtitle")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-sm font-semibold tnum text-foreground" data-testid="withdrawable-balance">
              {usd(withdrawable)}
            </span>
            <ChevronRight size={20} strokeWidth={1.75} className="text-muted-foreground" aria-hidden />
          </div>
        </Row>
      </Block>

      <WithdrawalRequestSheet open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
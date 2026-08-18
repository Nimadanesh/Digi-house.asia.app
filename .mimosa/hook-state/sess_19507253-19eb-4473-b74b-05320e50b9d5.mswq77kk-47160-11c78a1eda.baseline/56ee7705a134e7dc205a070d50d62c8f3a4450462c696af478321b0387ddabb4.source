"use client";
// File responsibility: Home next-rent card with live DHMS countdown (Fable Home §Next Rent).
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import { usePayoutCountdownDhms } from "@/hooks/usePayoutCountdownDhms";
import { Block } from "@/components/common/Block";

export function NextPayoutCard({
  projectedUsd,
  onNavigateHaptic,
}: {
  projectedUsd: number;
  onNavigateHaptic?: () => void;
}) {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const countdown = usePayoutCountdownDhms();

  return (
    <Link
      href={ROUTES.earnings}
      onClick={() => onNavigateHaptic?.()}
      className="block active:scale-[0.99] transition-transform duration-[120ms] ease-out"
      data-testid="next-payout-card"
    >
      <Block className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-primary/12 text-primary">
              <CalendarClock size={20} strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium leading-snug text-muted-foreground">{t("nextPayout")}</p>
              <p
                className="text-[0.9375rem] font-semibold tnum leading-snug tracking-tight text-foreground"
                data-testid="next-payout-timer"
              >
                {countdown}
              </p>
            </div>
          </div>
          <div className="shrink-0 space-y-1 text-end">
            <p className="text-[0.6875rem] leading-snug text-muted-foreground">{tCommon("est")}</p>
            <p className="text-[1.0625rem] font-bold tnum text-success" data-testid="next-payout-amount">
              ≈ {usd(projectedUsd)}
            </p>
          </div>
        </div>
      </Block>
    </Link>
  );
}

"use client";
// File responsibility: Home next-rent card with live DHMS countdown (Fable Home §Next Rent).
import Link from "next/link";
import { CalendarClock } from "lucide-react";
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
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Next Payout</p>
              <p
                className="mt-0.5 text-[0.9375rem] font-semibold tnum text-foreground leading-snug tracking-tight"
                data-testid="next-payout-timer"
              >
                {countdown}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[0.6875rem] text-muted-foreground">Est.</p>
            <p className="text-[1.0625rem] font-bold tnum text-success" data-testid="next-payout-amount">
              ≈ {usd(projectedUsd)}
            </p>
          </div>
        </div>
      </Block>
    </Link>
  );
}

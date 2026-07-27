"use client";
// File responsibility: render the next-Friday payout countdown readout (text only, reduced-motion safe).
// `variant="long"` matches Home Next Payout card; default keeps compact Earnings chrome.
import { usePayoutCountdown } from "@/hooks/usePayoutCountdown";
import { usePayoutCountdownLong } from "@/hooks/usePayoutCountdownLong";

export function PayoutCountdown({ variant = "compact" }: { variant?: "compact" | "long" }) {
  if (variant === "long") {
    return <PayoutCountdownLong />;
  }
  return <PayoutCountdownCompact />;
}

function PayoutCountdownLong() {
  const long = usePayoutCountdownLong();
  return (
    <span className="tnum font-semibold text-foreground" data-testid="payout-countdown-long">
      {long}
    </span>
  );
}

function PayoutCountdownCompact() {
  const short = usePayoutCountdown();
  return <span className="text-xs text-muted-foreground tnum">Next payout Fri · {short}</span>;
}

// File responsibility: the single primary-buy total computation shared by the
// summary sheet and the MainButton confirm label. Integer cents throughout;
// unknown fee tier previews $0 — the server always computes the actual charge.
import { previewFeeUsd, type FeeTier } from "@/types/fees";

export interface BuyQuote {
  totalUsd: number;
  feesUsd: number;
  totalPayableUsd: number;
}

export function previewBuyQuote(
  qty: number,
  unitPriceUsd: number,
  feeTiers: FeeTier[],
): BuyQuote {
  const totalUsd = qty * unitPriceUsd;
  const feesUsd = previewFeeUsd(feeTiers, totalUsd, "buy_primary") ?? 0;
  return { totalUsd, feesUsd, totalPayableUsd: totalUsd + feesUsd };
}

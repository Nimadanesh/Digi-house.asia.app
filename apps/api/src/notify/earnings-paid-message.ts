export type BuildEarningsPaidMessageInput = {
  amountUsd: number;
  propertyTitle: string;
  weekOf: string;
  settlementMode?: string | null;
};

/**
 * Build honest Telegram notification text for a paid earnings entry.
 *
 * - mock / hybrid: must NOT claim rent is in wallet / on-chain (ADR-001 §3).
 * - onchain + real hash: may mention earnings recorded; still no overclaim
 *   without explorer link (handled by caller if needed).
 *
 * Units: amountUsd is integer cents — formatted here as dollars.
 */
export function buildEarningsPaidMessage(
  input: BuildEarningsPaidMessageInput,
): string {
  const { amountUsd, propertyTitle, weekOf, settlementMode } = input;
  const dollars = formatCents(amountUsd);
  const week = weekOf.slice(0, 10);

  const isOnchain = settlementMode === "onchain";

  // ADR-001 §3: hybrid/mock must not claim "in your wallet" or "on-chain".
  if (isOnchain) {
    return [
      `🏠 <b>Weekly Rental Payout</b>`,
      ``,
      `Property: ${propertyTitle}`,
      `Week: ${week}`,
      `Amount: <b>$${dollars}</b>`,
      ``,
      `Your earnings have been recorded.`,
    ].join("\n");
  }

  return [
    `🏠 <b>Weekly Rental Payout (Demo)</b>`,
    ``,
    `Property: ${propertyTitle}`,
    `Week: ${week}`,
    `Amount: <b>$${dollars}</b>`,
    ``,
    `This is a simulated / hybrid payout — not yet on-chain.`,
    `On-chain verifiable payouts are post-MVP.`,
  ].join("\n");
}

function formatCents(cents: number): string {
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remaining = abs % 100;
  const padded = remaining.toString().padStart(2, "0");
  return `${dollars}.${padded}`;
}

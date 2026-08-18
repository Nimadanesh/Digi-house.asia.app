import { Hono } from "hono";
import type { FeeTierStore, FeeTierRecord } from "../fees/fee-tier-store.js";
import { resolveFee, type FeeOp } from "../fees/resolve-fee.js";

const OPS: readonly FeeOp[] = [
  "buy_primary",
  "buy_secondary",
  "sell_secondary",
  "sell_instant",
] as const;

function parseOp(v: string | undefined): FeeOp | null {
  return (OPS as readonly string[]).includes(v ?? "") ? (v as FeeOp) : null;
}

function tierPublic(t: FeeTierRecord) {
  return {
    id: t.id,
    minAmountUsd: t.minAmountUsd,
    maxAmountUsd: t.maxAmountUsd,
    buyPrimaryBps: t.buyPrimaryBps,
    buySecondaryBps: t.buySecondaryBps,
    sellSecondaryBps: t.sellSecondaryBps,
  };
}

export type FeeRouteDeps = {
  tiers: FeeTierStore;
};

/**
 * Public fee endpoints (PRODUCT-PLAN PA-04). The schedule is product-visible
 * information; no session required. Amounts are integer cents, matching the
 * rest of the money API.
 */
export function createFeeRoutes(deps: FeeRouteDeps) {
  const app = new Hono();

  app.get("/v1/fees", async (c) => {
    const tiers = await deps.tiers.listAll();
    return c.json({ tiers: tiers.map(tierPublic) });
  });

  app.get("/v1/fees/preview", async (c) => {
    const amountRaw = c.req.query("amountUsd");
    const opRaw = c.req.query("op");

    const amountUsd = Number(amountRaw);
    if (
      !amountRaw ||
      !Number.isInteger(amountUsd) ||
      amountUsd <= 0
    ) {
      return c.json(
        {
          code: "validation_error",
          message: "amountUsd must be a positive integer (cents)",
        },
        400,
      );
    }

    const op = parseOp(opRaw);
    if (!op) {
      return c.json(
        {
          code: "validation_error",
          message: `op must be one of: ${OPS.join(", ")}`,
        },
        400,
      );
    }

    const tiers = await deps.tiers.listAll();
    const quote = resolveFee(tiers, amountUsd, op);
    if (!quote) {
      return c.json(
        {
          code: "no_fee_tier",
          message: "No fee tier covers this amount (minimum ticket is 80$)",
        },
        404,
      );
    }

    return c.json({
      op: quote.op,
      amountUsd: quote.amountUsd,
      tierId: quote.tierId,
      bps: quote.bps,
      feeUsd: quote.feeUsd,
      netUsd: quote.netUsd,
      totalUsd: quote.totalUsd,
    });
  });

  return app;
}

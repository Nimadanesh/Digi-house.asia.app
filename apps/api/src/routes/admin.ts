import { Hono, type Context } from "hono";
import type { AuditStore } from "../audit/audit-store.js";
import { writeAuditEvent } from "../audit/write-audit.js";
import { requireAdminSecret } from "../admin/admin-middleware.js";
import type { PauseScope, PropertyStore } from "../marketplace/property-store.js";
import type { S3Signer } from "../lib/s3-sign.js";
import type { OrderRecord, OrderSide } from "../orders/map-order.js";
import type { OrderStore } from "../orders/order-store.js";
import type { TradeStore } from "../orders/trade-store.js";
import type { HoldingStore } from "../portfolio/holding-store.js";
import type { BalanceStore } from "../money/balance-store.js";
import type { FeeTierStore } from "../fees/fee-tier-store.js";
import type { TxStore } from "../buys/tx-store.js";
import {
  buyEscrowUsd,
  settleMatchesForTaker,
} from "../orders/settle-matches.js";
import { sendTelegramMessage } from "../notify/telegram-notify.js";
import type {
  WithdrawalRecord,
  WithdrawalStatus,
  WithdrawalStore,
} from "../withdrawals/withdrawal-store.js";
import {
  approveWithdrawal,
  payInstallment,
  payNextInstallment,
  rejectWithdrawal,
} from "../withdrawals/withdrawal-service.js";
import type {
  WithdrawalInstallmentRecord,
  WithdrawalInstallmentStore,
} from "../withdrawals/installment-store.js";
import { withdrawalToPublic } from "./withdrawals.js";
import type { NftQueueLike, NftStore, NftStatus } from "../nft/nft-store.js";
import { runNftSweep } from "../nft/worker.js";
import type { Logger } from "../logger.js";

const silentLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  fatal: () => {},
  trace: () => {},
  child: () => silentLogger,
} as unknown as Logger;
import type { ShareLockStore } from "../yield/lock-store.js";
import type { YieldStore } from "../yield/yield-store.js";
import {
  matureDueLocks,
  tickYieldAccrual,
  tickYieldPayouts,
} from "../yield/tick-yield.js";

const VALID_SCOPES: PauseScope[] = ["sale", "distribution", "all"];

function isPauseScope(v: unknown): v is PauseScope {
  return VALID_SCOPES.includes(v as PauseScope);
}

function clampInt(v: unknown, min: number, max: number, def: number): number {
  if (typeof v !== "number" || !Number.isInteger(v)) return def;
  return Math.min(max, Math.max(min, v));
}

function clampNum(v: unknown, min: number, max: number, def: number): number {
  if (typeof v !== "number" || Number.isNaN(v)) return def;
  return Math.min(max, Math.max(min, v));
}

export type AdminRouteDeps = {
  adminSecret: string;
  properties: PropertyStore;
  audit?: AuditStore | null;
  s3Signer?: S3Signer | null;
  /** Present → admin can seed house-account liquidity orders (PD-03). */
  orders?: OrderStore | null;
  trades?: TradeStore | null;
  holdings?: HoldingStore | null;
  balances?: BalanceStore | null;
  feeTiers?: FeeTierStore | null;
  transactions?: TxStore | null;
  /** House account user id (env HOUSE_ACCOUNT_USER_ID). */
  houseAccountUserId?: string;
  /** Present → admin withdrawal queue (PE-03). */
  withdrawals?: WithdrawalStore | null;
  /** Present → installment-aware withdrawal queue (locked model: 4 weekly installments). */
  installments?: WithdrawalInstallmentStore | null;
  /** Present → manual yield payout (PE-04) + unlock maturation controls (PE-07). */
  locks?: ShareLockStore | null;
  yields?: YieldStore | null;
  /** Unlock maturation window ms (PRODUCT-PLAN §0.4: 2–3 days). Default 3 days. */
  unlockMaturationMs?: number;
  /** Optional Telegram notify on each withdrawal transition (fail-open). */
  notify?: { botToken: string } | null;
  /** Present → collectible-NFT admin queue + retry/sweep controls. */
  nfts?: NftStore | null;
  nftQueue?: NftQueueLike | null;
  nftSweep?: {
    stalePendingMs: number;
    staleActiveMs: number;
  } | null;
  log?: Logger;
};

function isNftStatus(v: string | undefined): v is NftStatus {
  return (
    v === "pending" ||
    v === "minting" ||
    v === "minted" ||
    v === "transferring" ||
    v === "delivered" ||
    v === "failed"
  );
}

type CoreWithdrawalDeps = {
  balances: BalanceStore;
  transactions: TxStore;
  withdrawals: WithdrawalStore;
  installments: WithdrawalInstallmentStore;
};

function isWithdrawalStatus(v: string | undefined): v is WithdrawalStatus {
  return (
    v === "requested" || v === "approved" || v === "rejected" || v === "paid"
  );
}

/**
 * Place one house-account liquidity order (PD-03/PE-06): escrow provisioned on
 * demand for buys, inserted flagged is_house_account, then matched immediately so
 * it can also take liquidity. House orders never match each other (engine guard).
 */
export async function placeHouseOrder(
  deps: AdminRouteDeps,
  propertyId: string,
  side: OrderSide,
  priceUsd: number,
  quantity: number,
): Promise<{ order: OrderRecord; executedQuantity: number } | { error: "no_fee_tier" }> {
  const houseUserId = deps.houseAccountUserId ?? "house-account";
  let escrowTotal = 0;
  if (side === "buy") {
    const tiers = await deps.feeTiers!.listAll();
    const escrow = buyEscrowUsd(tiers, priceUsd, quantity);
    if (!escrow) return { error: "no_fee_tier" };
    escrowTotal = escrow.total;
    // House account balance is provisioned on demand (platform wallet).
    await deps.balances!.adjust(houseUserId, { investingDelta: escrow.total });
    await deps.balances!.adjust(houseUserId, { investingDelta: -escrow.total });
  }
  const order = await deps.orders!.insert({
    id: `ord_house_${crypto.randomUUID()}`,
    userId: houseUserId,
    propertyId,
    makerAddress: "EQHouseAccount",
    side,
    priceUsd,
    quantity,
    status: "open",
    escrowedUsd: escrowTotal,
    isHouseAccount: true,
  });
  const result = await settleMatchesForTaker(
    {
      orders: deps.orders!,
      trades: deps.trades!,
      holdings: deps.holdings!,
      balances: deps.balances!,
      transactions: deps.transactions!,
      feeTiers: await deps.feeTiers!.listAll(),
      audit: deps.audit ?? null,
    },
    order,
  );
  const executedQuantity = result.fills.reduce((s, f) => s + f.quantity, 0);
  return { order, executedQuantity };
}

export type SeededHouseOrder = {
  order: OrderRecord;
  side: OrderSide;
  priceUsd: number;
  quantity: number;
  executedQuantity: number;
};

export type SeedHouseBookResult =
  | {
      ok: true;
      referencePriceUsd: number;
      /** Effective (post-clamp) seeding parameters. */
      levels: number;
      spreadPct: number;
      qtyPerLevel: number;
      orders: SeededHouseOrder[];
      executedQuantity: number;
    }
  | { ok: false; error: "not_found" | "invalid_phase" | "no_reference_price" | "no_fee_tier" };

/**
 * Seed a two-sided house liquidity book around the reference price (last trade,
 * else offering price) on a secondary market (PE-06). Places `levels` bids below
 * and `levels` asks above at `spreadPct` steps, each `qtyPerLevel` shares, all
 * flagged is_house_account. Runs matching after each so they can take liquidity;
 * house orders never match each other (engine guard). Shared by the admin route
 * and the `db:seed-house-books` script — one implementation, no drift.
 */
export async function seedHouseBook(
  deps: AdminRouteDeps,
  propertyId: string,
  opts: { levels?: number; spreadPct?: number; qtyPerLevel?: number } = {},
): Promise<SeedHouseBookResult> {
  const listing = await deps.properties.getById(propertyId);
  if (!listing) return { ok: false, error: "not_found" };
  if (listing.status === "funding") return { ok: false, error: "invalid_phase" };

  const levels = clampInt(opts.levels, 1, 5, 3);
  const spreadPct = clampNum(opts.spreadPct, 0.1, 10, 1);
  const qtyPerLevel = clampInt(opts.qtyPerLevel, 1, 100, 5);

  // Reference price: last executed trade on the book, else the offering price.
  const last = await deps.trades!.lastPriceUsd(propertyId);
  const reference = last ?? listing.sharePriceUsd;
  if (!reference || reference <= 0) {
    return { ok: false, error: "no_reference_price" };
  }

  const seeded: SeededHouseOrder[] = [];
  let totalExecuted = 0;

  for (let k = 1; k <= levels; k++) {
    const bidPrice = Math.max(1, Math.round(reference * (1 - (k * spreadPct) / 100)));
    const askPrice = Math.max(1, Math.round(reference * (1 + (k * spreadPct) / 100)));
    const levelOrders: Array<{ side: OrderSide; priceUsd: number }> = [
      { side: "buy", priceUsd: bidPrice },
      { side: "sell", priceUsd: askPrice },
    ];
    for (const { side, priceUsd } of levelOrders) {
      const placed = await placeHouseOrder(deps, propertyId, side, priceUsd, qtyPerLevel);
      if ("error" in placed) return { ok: false, error: "no_fee_tier" };
      totalExecuted += placed.executedQuantity;
      seeded.push({
        order: placed.order,
        side,
        priceUsd,
        quantity: qtyPerLevel,
        executedQuantity: placed.executedQuantity,
      });
    }
  }

  return {
    ok: true,
    referencePriceUsd: reference,
    levels,
    spreadPct,
    qtyPerLevel,
    orders: seeded,
    executedQuantity: totalExecuted,
  };
}

export function createAdminRoutes(deps: AdminRouteDeps) {
  const app = new Hono();

  app.use("/v1/admin/*", requireAdminSecret(deps.adminSecret));

  app.post("/v1/admin/properties/:id/pause", async (c) => {
    const id = c.req.param("id");
    if (!id?.trim()) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    const listing = await deps.properties.getById(id);
    if (!listing) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    let body: { scope?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        { code: "validation_error", message: "Invalid JSON body" },
        400,
      );
    }
    const scope = body?.scope;
    if (!isPauseScope(scope)) {
      return c.json(
        {
          code: "validation_error",
          message: "scope must be 'sale', 'distribution', or 'all'",
        },
        400,
      );
    }

    const flags: { salePaused?: boolean; distributionPaused?: boolean } = {};
    if (scope === "sale" || scope === "all") flags.salePaused = true;
    if (scope === "distribution" || scope === "all")
      flags.distributionPaused = true;

    const updated = await deps.properties.setPauseFlags(id, flags);
    if (!updated) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "admin.pause",
        actorType: "admin",
        actorUserId: null,
        actorLabel: "admin",
        resourceType: "property",
        resourceId: id,
        summary: `Paused ${scope} for property ${id}`,
        payload: { propertyId: id, scope, flags },
      });
    }

    return c.json({ ok: true, property: updated });
  });

  app.post("/v1/admin/properties/:id/unpause", async (c) => {
    const id = c.req.param("id");
    if (!id?.trim()) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    const listing = await deps.properties.getById(id);
    if (!listing) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    let body: { scope?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        { code: "validation_error", message: "Invalid JSON body" },
        400,
      );
    }
    const scope = body?.scope;
    if (!isPauseScope(scope)) {
      return c.json(
        {
          code: "validation_error",
          message: "scope must be 'sale', 'distribution', or 'all'",
        },
        400,
      );
    }

    const flags: { salePaused?: boolean; distributionPaused?: boolean } = {};
    if (scope === "sale" || scope === "all") flags.salePaused = false;
    if (scope === "distribution" || scope === "all")
      flags.distributionPaused = false;

    const updated = await deps.properties.setPauseFlags(id, flags);
    if (!updated) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "admin.unpause",
        actorType: "admin",
        actorUserId: null,
        actorLabel: "admin",
        resourceType: "property",
        resourceId: id,
        summary: `Unpaused ${scope} for property ${id}`,
        payload: { propertyId: id, scope, flags },
      });
    }

    return c.json({ ok: true, property: updated });
  });

  app.post("/v1/admin/properties", async (c) => {
    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ code: "validation_error", message: "Invalid JSON body" }, 400);
    }

    const { title, location, description, totalShares, sharePriceUsd, annualRentUsd, ownerWalletAddress, meta, images, status } = body as Record<string, unknown>;

    if (!title || typeof title !== "string" || !title.trim()) {
      return c.json({ code: "validation_error", message: "title is required" }, 400);
    }
    if (!location || typeof location !== "string" || !location.trim()) {
      return c.json({ code: "validation_error", message: "location is required" }, 400);
    }
    if (!description || typeof description !== "string" || !description.trim()) {
      return c.json({ code: "validation_error", message: "description is required" }, 400);
    }
    if (typeof totalShares !== "number" || totalShares <= 0 || !Number.isInteger(totalShares)) {
      return c.json({ code: "validation_error", message: "totalShares must be a positive integer" }, 400);
    }
    if (typeof sharePriceUsd !== "number" || sharePriceUsd <= 0 || !Number.isInteger(sharePriceUsd)) {
      return c.json({ code: "validation_error", message: "sharePriceUsd must be a positive integer (cents)" }, 400);
    }
    if (typeof annualRentUsd !== "number" || annualRentUsd <= 0 || !Number.isInteger(annualRentUsd)) {
      return c.json({ code: "validation_error", message: "annualRentUsd must be a positive integer (cents)" }, 400);
    }
    if (!ownerWalletAddress || typeof ownerWalletAddress !== "string" || !ownerWalletAddress.trim()) {
      return c.json({ code: "validation_error", message: "ownerWalletAddress is required" }, 400);
    }
    if (!meta || typeof meta !== "object") {
      return c.json({ code: "validation_error", message: "meta is required" }, 400);
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const shortId = crypto.randomUUID().slice(0, 8);
    const propertyId = `prop-${slug}-${shortId}`;

    const created = await deps.properties.create({
      id: propertyId,
      title: title.trim(),
      location: location.trim(),
      description: description.trim(),
      images: Array.isArray(images) ? images.map(String) : [],
      totalShares,
      sharePriceUsd,
      annualRentUsd,
      ownerWalletAddress: ownerWalletAddress.trim(),
      meta: meta as Record<string, unknown>,
      status: status === "funding" || status === "funded" || status === "resale" ? status : "draft",
    });

    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "admin.create",
        actorType: "admin",
        actorUserId: null,
        actorLabel: "admin",
        resourceType: "property",
        resourceId: propertyId,
        summary: `Created property ${title}`,
        payload: { propertyId, title, status: created.status },
      });
    }

    return c.json({ ok: true, property: created }, 201);
  });

  app.patch("/v1/admin/properties/:id", async (c) => {
    const id = c.req.param("id");
    if (!id?.trim()) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    const existing = await deps.properties.getById(id);
    if (!existing) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ code: "validation_error", message: "Invalid JSON body" }, 400);
    }

    const patch: Record<string, unknown> = {};
    const numericFields = ["totalShares", "sharePriceUsd", "annualRentUsd", "sharesSold"] as const;

    for (const field of ["title", "location", "description", "images", "totalShares", "sharePriceUsd", "annualRentUsd", "ownerWalletAddress", "meta", "status", "sharesSold"] as const) {
      if (body[field] !== undefined) {
        if (field === "status") {
          const s = String(body[field]);
          if (!["draft", "funding", "funded", "resale"].includes(s)) {
            return c.json({ code: "validation_error", message: `Invalid status "${s}"` }, 400);
          }
          patch[field] = s;
        } else if ((numericFields as readonly string[]).includes(field)) {
          const v = body[field];
          if (typeof v !== "number" || v <= 0 || !Number.isInteger(v)) {
            return c.json({ code: "validation_error", message: `${field} must be a positive integer` }, 400);
          }
          patch[field] = v;
        } else {
          patch[field] = body[field];
        }
      }
    }

    if (Object.keys(patch).length === 0) {
      return c.json({ code: "validation_error", message: "No fields to update" }, 400);
    }

    const updated = await deps.properties.update(id, patch as unknown as Parameters<PropertyStore["update"]>[1]);

    if (deps.audit && updated) {
      await writeAuditEvent(deps.audit, {
        action: "admin.update",
        actorType: "admin",
        actorUserId: null,
        actorLabel: "admin",
        resourceType: "property",
        resourceId: id,
        summary: `Updated property ${id}`,
        payload: { propertyId: id, patch },
      });
    }

    return c.json({ ok: true, property: updated });
  });

  app.post("/v1/admin/properties/:id/media/sign", async (c) => {
    const id = c.req.param("id");
    if (!id?.trim()) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    const existing = await deps.properties.getById(id);
    if (!existing) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    if (!deps.s3Signer) {
      return c.json(
        { code: "not_configured", message: "R2 media upload is not configured" },
        501,
      );
    }

    let body: { filename?: string; contentType?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ code: "validation_error", message: "Invalid JSON body" }, 400);
    }

    const filename = body?.filename;
    const contentType = body?.contentType;
    if (!filename || typeof filename !== "string" || !filename.trim()) {
      return c.json({ code: "validation_error", message: "filename is required" }, 400);
    }
    if (!contentType || typeof contentType !== "string" || !contentType.trim()) {
      return c.json({ code: "validation_error", message: "contentType is required" }, 400);
    }

    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `uploads/${crypto.randomUUID()}-${sanitized}`;
    const { signedUrl, publicUrl } = deps.s3Signer.getSignedPutUrl(key, contentType);

    return c.json({ signedUrl, publicUrl, key });
  });

  /**
   * POST /v1/admin/yield/payout (PE-04) — manual yield payout. Runs the same engine
   * math as the worker (accrue → pay due installments, crediting withdrawable) for one
   * user (`{ userId }`) or all users (empty body). Idempotent — repeated runs never
   * double-credit (payment insert is the claim).
   */
  app.post("/v1/admin/yield/payout", async (c) => {
    if (!deps.locks || !deps.yields || !deps.balances || !deps.transactions) {
      return c.json(
        { code: "not_configured", message: "Yield stores not configured" },
        501,
      );
    }
    let body: { userId?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        { code: "validation_error", message: "Invalid JSON body" },
        400,
      );
    }
    const userId =
      typeof body.userId === "string" && body.userId.trim()
        ? body.userId.trim()
        : undefined;

    const engine = {
      locks: deps.locks,
      yields: deps.yields,
      balances: deps.balances,
      transactions: deps.transactions,
      log: deps.log,
      audit: deps.audit ?? null,
      notify: deps.notify
        ? {
            botToken: deps.notify.botToken,
            getPropertyTitle: async (propertyId: string) =>
              (await deps.properties.getById(propertyId))?.title ?? propertyId,
          }
        : null,
    };
    const accrual = await tickYieldAccrual(engine, new Date(), userId);
    const payouts = await tickYieldPayouts(engine, new Date(), userId);

    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "admin.yield_payout",
        actorType: "admin",
        actorUserId: null,
        actorLabel: "admin",
        resourceType: "yield",
        resourceId: userId ?? "all",
        summary: `Manual yield payout (${userId ?? "all"}): ${payouts.length} settlements`,
        payload: {
          scope: userId ?? "all",
          accrualRows: accrual.rowsInserted,
          payouts: payouts.map((p) => ({
            lockId: p.lockId,
            amountUsd: p.amountUsd,
            kind: p.kind,
          })),
        },
      });
    }

    return c.json({
      ok: true,
      scope: userId ?? "all",
      accrual,
      payouts,
    });
  });

  /**
   * POST /v1/admin/locks/mature (PE-07) — run the unlock maturation pass now.
   * Matures every unlock_requested lock past the 2–3 day window (the same engine
   * the worker runs), so an admin can trigger it manually instead of waiting for
   * the next tick. Idempotent — matured locks are never touched again.
   */
  app.post("/v1/admin/locks/mature", async (c) => {
    if (!deps.locks || !deps.yields || !deps.balances || !deps.transactions) {
      return c.json(
        { code: "not_configured", message: "Yield stores not configured" },
        501,
      );
    }
    const engine = {
      locks: deps.locks,
      yields: deps.yields,
      balances: deps.balances,
      transactions: deps.transactions,
      log: deps.log,
      audit: deps.audit ?? null,
      notify: deps.notify
        ? {
            botToken: deps.notify.botToken,
            getPropertyTitle: async (propertyId: string) =>
              (await deps.properties.getById(propertyId))?.title ?? propertyId,
          }
        : null,
    };
    const maturationMs =
      deps.unlockMaturationMs ?? 3 * 24 * 3_600_000;
    const matured = await matureDueLocks(engine, maturationMs);

    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "admin.lock_mature",
        actorType: "admin",
        actorUserId: null,
        actorLabel: "admin",
        resourceType: "share_lock",
        resourceId: "all",
        summary: `Manual maturation pass: ${matured.length} lock(s) matured`,
        payload: { lockIds: matured, maturationMs },
      });
    }

    return c.json({ ok: true, matured });
  });

  /**
   * POST /v1/admin/locks/:id/mature (PE-07) — force-mature a single lock
   * (edge-case recovery). Bypasses the 2–3 day window for an unlock_requested
   * lock that should already be free (e.g. worker was down). Guarded — only
   * unlock_requested locks can be matured, and only once.
   */
  app.post("/v1/admin/locks/:id/mature", async (c) => {
    if (!deps.locks) {
      return c.json(
        { code: "not_configured", message: "Lock store not configured" },
        501,
      );
    }
    const id = c.req.param("id");
    const existing = await deps.locks.get(id);
    if (!existing) {
      return c.json({ code: "not_found", message: "Lock not found" }, 404);
    }
    if (existing.status === "matured") {
      return c.json(
        { code: "conflict", message: "Lock is already matured" },
        409,
      );
    }
    if (existing.status === "locked") {
      return c.json(
        {
          code: "conflict",
          message: "Lock has not requested unlock — nothing to mature",
        },
        409,
      );
    }

    const matured = await deps.locks.markMatured(id, new Date());
    if (!matured) {
      return c.json(
        { code: "conflict", message: "Lock cannot be matured from its current state" },
        409,
      );
    }

    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "admin.lock_mature_manual",
        actorType: "admin",
        actorUserId: null,
        actorLabel: "admin",
        resourceType: "share_lock",
        resourceId: id,
        summary: `Manually matured lock ${id} (${matured.shares} shares of ${matured.propertyId})`,
        payload: {
          lockId: id,
          propertyId: matured.propertyId,
          shares: matured.shares,
          userId: matured.userId,
        },
      });
    }

    if (deps.notify) {
      try {
        await sendTelegramMessage({
          botToken: deps.notify.botToken,
          chatId: matured.userId,
          text:
            `🔓 Shares unlocked\n` +
            `${matured.shares} shares are now free — you can sell them on the market.`,
        });
      } catch {
        // fail-open: notification must never block the admin transition
      }
    }

    return c.json({ lock: { id: matured.id, status: matured.status } });
  });

  /**
   * GET /v1/admin/withdrawals (PE-03) — the withdrawal queue, newest first, with an
   * optional status filter. Manual USDT fulfillment: approve → mark-paid (or reject).
   */
  app.get("/v1/admin/withdrawals", async (c) => {
    if (!deps.withdrawals) {
      return c.json(
        { code: "not_configured", message: "Withdrawal store not configured" },
        501,
      );
    }
    const statusRaw = c.req.query("status");
    const status =
      statusRaw !== undefined && isWithdrawalStatus(statusRaw)
        ? statusRaw
        : undefined;
    if (statusRaw && !status) {
      return c.json(
        {
          code: "validation_error",
          message: "status must be requested, approved, rejected or paid",
        },
        400,
      );
    }
    const rows = await deps.withdrawals.listAll(
      status ? { status } : undefined,
    );
    const allInstallments = deps.installments
      ? await deps.installments.listByWithdrawals(rows.map((r) => r.id))
      : [];
    return c.json({
      withdrawals: rows.map((w) =>
        withdrawalToPublic(
          w,
          allInstallments.filter((i) => i.withdrawalId === w.id),
        ),
      ),
    });
  });

  async function coreWithdrawalDeps(): Promise<CoreWithdrawalDeps | null> {
    if (
      !deps.balances ||
      !deps.transactions ||
      !deps.withdrawals ||
      !deps.installments
    ) {
      return null;
    }
    return {
      balances: deps.balances,
      transactions: deps.transactions,
      withdrawals: deps.withdrawals,
      installments: deps.installments,
    };
  }

  async function respondTransition(
    c: Context,
    action: "admin.withdraw.approve" | "admin.withdraw.reject" | "admin.withdraw.paid",
    updated: WithdrawalRecord | null,
    notifyText: string,
    installments: WithdrawalInstallmentRecord[] = [],
  ) {
    if (!updated) {
      return c.json(
        {
          code: "conflict",
          message: "Withdrawal cannot be moved from its current state",
        },
        409,
      );
    }
    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action,
        actorType: "admin",
        actorUserId: null,
        actorLabel: "admin",
        resourceType: "withdrawal",
        resourceId: updated.id,
        summary: `${action} ${updated.id} — $${(updated.amountUsd / 100).toFixed(2)}`,
        payload: { withdrawalId: updated.id, amountUsd: updated.amountUsd },
      });
    }
    if (deps.notify) {
      try {
        await sendTelegramMessage({
          botToken: deps.notify.botToken,
          chatId: updated.userId,
          text: notifyText,
        });
      } catch {
        // fail-open: notification must never block the admin transition
      }
    }
    return c.json({ withdrawal: withdrawalToPublic(updated, installments) });
  }

  app.post("/v1/admin/withdrawals/:id/approve", async (c) => {
    const core = await coreWithdrawalDeps();
    if (!core) {
      return c.json(
        { code: "not_configured", message: "Withdrawal stores not configured" },
        501,
      );
    }
    const id = c.req.param("id");
    const existing = await core.withdrawals.get(id);
    if (!existing) {
      return c.json({ code: "not_found", message: "Withdrawal not found" }, 404);
    }
    const updated = await approveWithdrawal(core, { withdrawalId: id });
    return respondTransition(
      c,
      "admin.withdraw.approve",
      updated,
      `✅ Withdrawal approved\n$${(existing.amountUsd / 100).toFixed(2)} USDT — payment is being prepared.`,
    );
  });

  app.post("/v1/admin/withdrawals/:id/reject", async (c) => {
    const core = await coreWithdrawalDeps();
    if (!core) {
      return c.json(
        { code: "not_configured", message: "Withdrawal stores not configured" },
        501,
      );
    }
    const id = c.req.param("id");
    const existing = await core.withdrawals.get(id);
    if (!existing) {
      return c.json({ code: "not_found", message: "Withdrawal not found" }, 404);
    }
    if (existing.status === "rejected" || existing.status === "paid") {
      return c.json(
        { code: "conflict", message: "Withdrawal is already terminal" },
        409,
      );
    }
    const updated = await rejectWithdrawal(core, { withdrawalId: id });
    return respondTransition(
      c,
      "admin.withdraw.reject",
      updated,
      `↩️ Withdrawal rejected\n$${(existing.amountUsd / 100).toFixed(2)} USDT was refunded to your withdrawable balance.`,
    );
  });

  /**
   * POST /v1/admin/withdrawals/:id/mark-paid — mark the NEXT unpaid installment paid
   * (locked model: 4 weekly installments; call once per installment). The withdrawal
   * flips to `paid` and the ledger row succeeds only when all 4 installments are paid.
   */
  app.post("/v1/admin/withdrawals/:id/mark-paid", async (c) => {
    const core = await coreWithdrawalDeps();
    if (!core) {
      return c.json(
        { code: "not_configured", message: "Withdrawal stores not configured" },
        501,
      );
    }
    let body: { txHash?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        { code: "validation_error", message: "Invalid JSON body" },
        400,
      );
    }
    const txHash = typeof body.txHash === "string" ? body.txHash.trim() : "";
    if (!txHash) {
      return c.json(
        { code: "validation_error", message: "txHash is required" },
        400,
      );
    }
    const id = c.req.param("id");
    const existing = await core.withdrawals.get(id);
    if (!existing) {
      return c.json({ code: "not_found", message: "Withdrawal not found" }, 404);
    }
    if (existing.status === "rejected" || existing.status === "paid") {
      return c.json(
        { code: "conflict", message: "Withdrawal is already terminal" },
        409,
      );
    }
    const result = await payNextInstallment(core, { withdrawalId: id, txHash });
    if (!result.ok) {
      if (result.code === "withdrawal_not_found") {
        return c.json({ code: "not_found", message: "Withdrawal not found" }, 404);
      }
      return c.json(
        {
          code: "conflict",
          message: "All installments are already paid",
        },
        409,
      );
    }
    const all = await core.installments.listByWithdrawal(id);
    const paidCount = all.filter((i) => i.status === "paid").length;
    const installments = await core.installments.listByWithdrawal(id);
    return respondTransition(
      c,
      "admin.withdraw.paid",
      result.withdrawal,
      `💸 Withdrawal installment ${result.installment.seq}/4 paid\n` +
        `$${(result.installment.amountUsd / 100).toFixed(2)} USDT sent to your address (${paidCount}/4 paid).`,
      installments,
    );
  });

  /**
   * POST /v1/admin/withdrawals/:id/installments/:seq/mark-paid — mark ONE specific
   * installment paid with the fulfillment tx hash (guarded; idempotent on already-paid).
   */
  app.post("/v1/admin/withdrawals/:id/installments/:seq/mark-paid", async (c) => {
    const core = await coreWithdrawalDeps();
    if (!core) {
      return c.json(
        { code: "not_configured", message: "Withdrawal stores not configured" },
        501,
      );
    }
    let body: { txHash?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        { code: "validation_error", message: "Invalid JSON body" },
        400,
      );
    }
    const txHash = typeof body.txHash === "string" ? body.txHash.trim() : "";
    if (!txHash) {
      return c.json(
        { code: "validation_error", message: "txHash is required" },
        400,
      );
    }
    const id = c.req.param("id");
    const seqRaw = Number(c.req.param("seq"));
    if (!Number.isInteger(seqRaw) || seqRaw < 1 || seqRaw > 4) {
      return c.json(
        { code: "validation_error", message: "seq must be 1..4" },
        400,
      );
    }
    const existing = await core.withdrawals.get(id);
    if (!existing) {
      return c.json({ code: "not_found", message: "Withdrawal not found" }, 404);
    }
    if (existing.status === "rejected" || existing.status === "paid") {
      return c.json(
        { code: "conflict", message: "Withdrawal is already terminal" },
        409,
      );
    }
    const result = await payInstallment(core, {
      withdrawalId: id,
      seq: seqRaw,
      txHash,
    });
    if (!result.ok) {
      if (result.code === "withdrawal_not_found") {
        return c.json({ code: "not_found", message: "Withdrawal not found" }, 404);
      }
      return c.json(
        {
          code: "conflict",
          message: `Installment ${seqRaw} is already paid`,
        },
        409,
      );
    }
    const installments = await core.installments.listByWithdrawal(id);
    return respondTransition(
      c,
      "admin.withdraw.paid",
      result.withdrawal,
      `💸 Withdrawal installment ${result.installment.seq}/4 paid\n` +
        `$${(result.installment.amountUsd / 100).toFixed(2)} USDT sent to your address.`,
      installments,
    );
  });

  /**
   * POST /v1/admin/properties/:id/house-orders (PD-03) — place a single platform
   * liquidity order on a secondary book. Runs matching immediately so it can also
   * take liquidity. House orders never match each other (match-engine guard).
   */
  app.post("/v1/admin/properties/:id/house-orders", async (c) => {
    if (
      !deps.orders ||
      !deps.trades ||
      !deps.holdings ||
      !deps.balances ||
      !deps.feeTiers ||
      !deps.transactions
    ) {
      return c.json(
        { code: "not_configured", message: "House-order stores not configured" },
        501,
      );
    }
    const id = c.req.param("id");
    const listing = await deps.properties.getById(id ?? "");
    if (!listing) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }
    if (listing.status === "funding") {
      return c.json(
        {
          code: "invalid_phase",
          message: "House orders live on the secondary market only",
        },
        409,
      );
    }

    let body: { side?: unknown; priceUsd?: unknown; quantity?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        { code: "validation_error", message: "Invalid JSON body" },
        400,
      );
    }
    const side = body.side;
    const priceUsd = body.priceUsd;
    const quantity = body.quantity;
    if (side !== "buy" && side !== "sell") {
      return c.json(
        { code: "validation_error", message: "side must be buy or sell" },
        400,
      );
    }
    if (
      typeof priceUsd !== "number" ||
      !Number.isInteger(priceUsd) ||
      priceUsd <= 0
    ) {
      return c.json(
        { code: "validation_error", message: "priceUsd must be integer cents > 0" },
        400,
      );
    }
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return c.json(
        { code: "validation_error", message: "quantity must be an integer > 0" },
        400,
      );
    }

    const houseUserId = deps.houseAccountUserId ?? "house-account";
    const placed = await placeHouseOrder(deps, id!, side as OrderSide, priceUsd, quantity);
    if ("error" in placed) {
      return c.json(
        { code: "no_fee_tier", message: "No fee tier covers this amount" },
        409,
      );
    }
    const { order, executedQuantity } = placed;

    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "admin.house_order",
        actorType: "user",
        actorUserId: houseUserId,
        resourceType: "order",
        resourceId: order.id,
        summary: `House ${side} order on ${id}: ${quantity} × $${(priceUsd / 100).toFixed(2)} (${executedQuantity} filled immediately)`,
        payload: { orderId: order.id, propertyId: id, side, priceUsd, quantity, executedQuantity },
        requestId: (c.var as { requestId?: string }).requestId ?? null,
      });
    }

    return c.json({ order: { ...order, executedQuantity } }, 201);
  });

  /**
   * POST /v1/admin/properties/:id/house-orders/seed (PE-06) — seed a two-sided
   * platform liquidity book around the reference price (last trade, else offering
   * price) on a secondary market. Shares the seedHouseBook implementation with the
   * `db:seed-house-books` script.
   */
  app.post("/v1/admin/properties/:id/house-orders/seed", async (c) => {
    if (
      !deps.orders ||
      !deps.trades ||
      !deps.holdings ||
      !deps.balances ||
      !deps.feeTiers ||
      !deps.transactions
    ) {
      return c.json(
        { code: "not_configured", message: "House-order stores not configured" },
        501,
      );
    }
    const id = c.req.param("id");

    let body: { levels?: unknown; spreadPct?: unknown; qtyPerLevel?: unknown } = {};
    try {
      body = await c.req.json();
    } catch {
      // empty body → defaults
    }

    const result = await seedHouseBook(deps, id ?? "", {
      levels: typeof body.levels === "number" ? body.levels : undefined,
      spreadPct: typeof body.spreadPct === "number" ? body.spreadPct : undefined,
      qtyPerLevel:
        typeof body.qtyPerLevel === "number" ? body.qtyPerLevel : undefined,
    });

    if (!result.ok) {
      if (result.error === "not_found") {
        return c.json({ code: "not_found", message: "Property not found" }, 404);
      }
      if (result.error === "invalid_phase") {
        return c.json(
          {
            code: "invalid_phase",
            message: "House orders live on the secondary market only",
          },
          409,
        );
      }
      if (result.error === "no_fee_tier") {
        return c.json(
          { code: "no_fee_tier", message: "No fee tier covers this amount" },
          409,
        );
      }
      return c.json(
        { code: "conflict", message: "No reference price to seed around" },
        409,
      );
    }

    const houseUserId = deps.houseAccountUserId ?? "house-account";
    const {
      referencePriceUsd,
      orders: seeded,
      executedQuantity: totalExecuted,
      levels,
      spreadPct,
      qtyPerLevel,
    } = result;

    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "admin.house_order_seed",
        actorType: "user",
        actorUserId: houseUserId,
        resourceType: "order",
        resourceId: id!,
        summary: `Seeded house book on ${id}: ${seeded.length} orders around $${(referencePriceUsd / 100).toFixed(2)} (${totalExecuted} filled immediately)`,
        payload: {
          propertyId: id,
          referencePriceUsd,
          levels,
          spreadPct,
          qtyPerLevel,
          orders: seeded.map((s) => ({
            orderId: s.order.id,
            side: s.side,
            priceUsd: s.priceUsd,
            quantity: s.quantity,
            executedQuantity: s.executedQuantity,
          })),
        },
        requestId: (c.var as { requestId?: string }).requestId ?? null,
      });
    }

    return c.json(
      {
        ok: true,
        referencePriceUsd,
        orders: seeded.map((s) => ({
          ...s.order,
          executedQuantity: s.executedQuantity,
        })),
        executedQuantity: totalExecuted,
      },
      201,
    );
  });

  /**
   * GET /v1/admin/nfts — collectible-NFT queue, newest first, optional ?status= filter.
   * The NFT is a display-only receipt; the DB holding stays the ownership source.
   */
  app.get("/v1/admin/nfts", async (c) => {
    if (!deps.nfts) {
      return c.json({ code: "not_configured", message: "NFT store not configured" }, 501);
    }
    const statusRaw = c.req.query("status");
    const status = statusRaw !== undefined && isNftStatus(statusRaw) ? statusRaw : undefined;
    if (statusRaw && !status) {
      return c.json(
        {
          code: "validation_error",
          message: "status must be pending, minting, minted, transferring, delivered or failed",
        },
        400,
      );
    }
    const rows = await deps.nfts.listAll(status ? { status } : undefined);
    return c.json({
      nfts: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        propertyId: r.propertyId,
        holdingKey: r.holdingKey,
        walletAddress: r.walletAddress,
        status: r.status,
        nftItemId: r.nftItemId,
        nftAddress: r.nftAddress,
        collectionAddress: r.collectionAddress,
        metadataUrl: r.metadataUrl,
        mintTxHash: r.mintTxHash,
        transferTxHash: r.transferTxHash,
        attempts: r.attempts,
        errorCode: r.errorCode,
        errorMessage: r.errorMessage,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  });

  /**
   * POST /v1/admin/nfts/:id/retry — re-queue a FAILED collectible-NFT delivery (failed →
   * pending + enqueue). Only explicit, admin-authorized retries — no arbitrary minting.
   */
  app.post("/v1/admin/nfts/:id/retry", async (c) => {
    if (!deps.nfts || !deps.nftQueue) {
      return c.json({ code: "not_configured", message: "NFT stores not configured" }, 501);
    }
    const id = c.req.param("id");
    const existing = await deps.nfts.get(id);
    if (!existing) {
      return c.json({ code: "not_found", message: "NFT not found" }, 404);
    }
    if (existing.status !== "failed") {
      return c.json(
        { code: "conflict", message: "Only failed NFTs can be retried" },
        409,
      );
    }
    const retried = await deps.nfts.retry(id);
    if (!retried) {
      return c.json({ code: "conflict", message: "NFT state changed — retry again" }, 409);
    }
    try {
      await deps.nftQueue.add({ name: "mintNft", data: { holdingNftId: id } });
    } catch (err) {
      deps.log?.warn({ nftId: id, err }, "admin.nft.retry_enqueue_failed");
    }
    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "nft.retry",
        actorType: "admin",
        actorUserId: null,
        actorLabel: "admin",
        resourceType: "holding_nft",
        resourceId: id,
        summary: `NFT delivery retried for ${existing.propertyId}`,
        payload: { nftId: id, propertyId: existing.propertyId, errorCode: existing.errorCode },
        requestId: (c.var as { requestId?: string }).requestId ?? null,
      });
    }
    return c.json({ nft: { id: retried.id, status: retried.status } });
  });

  /** POST /v1/admin/nfts/sweep — run the recovery sweep now (stale pending re-enqueue + timeouts). */
  app.post("/v1/admin/nfts/sweep", async (c) => {
    if (!deps.nfts || !deps.nftQueue) {
      return c.json({ code: "not_configured", message: "NFT stores not configured" }, 501);
    }
    const result = await runNftSweep(
      { nfts: deps.nfts, audit: deps.audit ?? null, log: deps.log ?? silentLogger },
      deps.nftQueue,
      {
        stalePendingMs: deps.nftSweep?.stalePendingMs ?? 5 * 60_000,
        staleActiveMs: deps.nftSweep?.staleActiveMs ?? 30 * 60_000,
      },
    );
    return c.json({ ok: true, ...result });
  });

  return app;
}

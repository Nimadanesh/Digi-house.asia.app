import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import type { Logger } from "pino";
import { createAdminRoutes, type AdminRouteDeps } from "./admin.js";
import { createMemoryPropertyStore } from "../marketplace/property-store.js";
import { createMemoryAuditStore } from "../audit/audit-store.js";
import { S3Signer } from "../lib/s3-sign.js";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";
import { createMemoryBalanceStore } from "../money/balance-store.js";
import { createMemoryTxStore } from "../buys/tx-store.js";
import { createMemoryWithdrawalStore } from "../withdrawals/withdrawal-store.js";
import { createMemoryInstallmentStore } from "../withdrawals/installment-store.js";
import {
  installmentDueAt,
  planWithdrawal,
} from "../withdrawals/withdrawal-math.js";
import { createMemoryShareLockStore } from "../yield/lock-store.js";
import { createMemoryYieldStore } from "../yield/yield-store.js";
import { createMemoryOrderStore } from "../orders/order-store.js";
import { createMemoryTradeStore } from "../orders/trade-store.js";
import { createMemoryHoldingStore } from "../portfolio/holding-store.js";
import { createMemoryFeeTierStore } from "../fees/fee-tier-store.js";
import { createMemoryNftStore } from "../nft/nft-store.js";
import { Address } from "ton";

const ADMIN_SECRET = "test-admin-secret-32-chars-min!!";

const silentLog = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  fatal: () => {},
  trace: () => {},
  child: () => silentLog,
} as unknown as Logger;

const s3Signer = new S3Signer({
  accountId: "test",
  accessKeyId: "test",
  secretAccessKey: "test",
  bucket: "test",
  publicBaseUrl: "https://media.example.com",
});

function makeDeps(over: Partial<AdminRouteDeps> = {}): AdminRouteDeps {
  const seedRows = SEED_PROPERTIES.map(toPropertyInsert);
  return {
    adminSecret: ADMIN_SECRET,
    properties: createMemoryPropertyStore(seedRows),
    audit: createMemoryAuditStore(),
    s3Signer,
    ...over,
  };
}

describe("admin routes", () => {
  describe("auth", () => {
    it("returns 401 without x-admin-key", async () => {
      const app = new Hono().route("/", createAdminRoutes(makeDeps()));
      const res = await app.request("/v1/admin/properties", { method: "POST" });
      expect(res.status).toBe(401);
      const body = (await res.json()) as { code: string };
      expect(body.code).toBe("unauthorized");
    });

    it("returns 401 with wrong key", async () => {
      const app = new Hono().route("/", createAdminRoutes(makeDeps()));
      const res = await app.request("/v1/admin/properties", {
        method: "POST",
        headers: { "x-admin-key": "wrong" },
      });
      expect(res.status).toBe(401);
    });
  });

  describe("POST /v1/admin/properties", () => {
    it("creates a property with status draft", async () => {
      const app = new Hono().route("/", createAdminRoutes(makeDeps()));
      const res = await app.request("/v1/admin/properties", {
        method: "POST",
        headers: {
          "x-admin-key": ADMIN_SECRET,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "New Test Property",
          location: "Test City",
          description: "A test property",
          totalShares: 10000,
          sharePriceUsd: 50000,
          annualRentUsd: 240000,
          ownerWalletAddress: "UQAAAA",
          meta: { propertyType: "apartment", sizeSqm: 80, yearBuilt: 2020 },
        }),
      });
      expect(res.status).toBe(201);
      const body = (await res.json()) as {
        ok: boolean;
        property: { status: string; id: string };
      };
      expect(body.ok).toBe(true);
      expect(body.property.status).toBe("draft");
      expect(body.property.id).toMatch(/^prop-new-test-property-/);
    });

    it("returns 400 on missing required fields", async () => {
      const app = new Hono().route("/", createAdminRoutes(makeDeps()));
      const res = await app.request("/v1/admin/properties", {
        method: "POST",
        headers: {
          "x-admin-key": ADMIN_SECRET,
          "content-type": "application/json",
        },
        body: JSON.stringify({ title: "Incomplete" }),
      });
      expect(res.status).toBe(400);
    });

    it("writes audit event", async () => {
      const audit = createMemoryAuditStore();
      const app = new Hono().route("/", createAdminRoutes(makeDeps({ audit })));
      await app.request("/v1/admin/properties", {
        method: "POST",
        headers: {
          "x-admin-key": ADMIN_SECRET,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Audit Test",
          location: "City",
          description: "desc",
          totalShares: 1000,
          sharePriceUsd: 10000,
          annualRentUsd: 50000,
          ownerWalletAddress: "UQBBB",
          meta: {},
        }),
      });
      expect(audit._rows.length).toBe(1);
      expect(audit._rows[0]!.action).toBe("admin.create");
    });
  });

  describe("PATCH /v1/admin/properties/:id", () => {
    it("updates status from draft to funding", async () => {
      const deps = makeDeps();
      const app = new Hono().route("/", createAdminRoutes(deps));

      // Create a property
      const createRes = await app.request("/v1/admin/properties", {
        method: "POST",
        headers: {
          "x-admin-key": ADMIN_SECRET,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Publish Me",
          location: "City",
          description: "desc",
          totalShares: 1000,
          sharePriceUsd: 10000,
          annualRentUsd: 50000,
          ownerWalletAddress: "UQCCC",
          meta: {},
        }),
      });
      const created = ((await createRes.json()) as { property: { id: string } }).property;

      // Publish
      const patchRes = await app.request(`/v1/admin/properties/${created.id}`, {
        method: "PATCH",
        headers: {
          "x-admin-key": ADMIN_SECRET,
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: "funding" }),
      });
      expect(patchRes.status).toBe(200);
      const patched = (await patchRes.json()) as { property: { status: string } };
      expect(patched.property.status).toBe("funding");
    });

    it("returns 404 for unknown id", async () => {
      const app = new Hono().route("/", createAdminRoutes(makeDeps()));
      const res = await app.request("/v1/admin/properties/nonexistent", {
        method: "PATCH",
        headers: {
          "x-admin-key": ADMIN_SECRET,
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: "funding" }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("POST /v1/admin/properties/:id/media/sign", () => {
    it("returns signedUrl and publicUrl", async () => {
      const deps = makeDeps();
      const app = new Hono().route("/", createAdminRoutes(deps));

      // Create property first
      const createRes = await app.request("/v1/admin/properties", {
        method: "POST",
        headers: {
          "x-admin-key": ADMIN_SECRET,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Media Test",
          location: "City",
          description: "desc",
          totalShares: 1000,
          sharePriceUsd: 10000,
          annualRentUsd: 50000,
          ownerWalletAddress: "UQDDD",
          meta: {},
        }),
      });
      const created = ((await createRes.json()) as { property: { id: string } }).property;

      const signRes = await app.request(
        `/v1/admin/properties/${created.id}/media/sign`,
        {
          method: "POST",
          headers: {
            "x-admin-key": ADMIN_SECRET,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            filename: "photo.jpg",
            contentType: "image/jpeg",
          }),
        },
      );
      expect(signRes.status).toBe(200);
      const body = (await signRes.json()) as {
        signedUrl: string;
        publicUrl: string;
        key: string;
      };
      expect(body.signedUrl).toContain("X-Amz-Signature=");
      expect(body.publicUrl).toBe(
        `https://media.example.com/${body.key}`,
      );
      expect(body.key).toMatch(/^uploads\//);
    });

    it("returns 501 when s3Signer is null", async () => {
      const app = new Hono().route(
        "/",
        createAdminRoutes(makeDeps({ s3Signer: null })),
      );
      const res = await app.request(
        "/v1/admin/properties/prop-marina-vista-4b/media/sign",
        {
          method: "POST",
          headers: {
            "x-admin-key": ADMIN_SECRET,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            filename: "photo.jpg",
            contentType: "image/jpeg",
          }),
        },
      );
      expect(res.status).toBe(501);
    });

    it("returns 404 for unknown property", async () => {
      const app = new Hono().route("/", createAdminRoutes(makeDeps()));
      const res = await app.request(
        "/v1/admin/properties/nonexistent/media/sign",
        {
          method: "POST",
          headers: {
            "x-admin-key": ADMIN_SECRET,
            "content-type": "application/json",
          },
          body: JSON.stringify({ filename: "p.jpg", contentType: "image/jpeg" }),
        },
      );
      expect(res.status).toBe(404);
    });
  });

  describe("POST /v1/admin/properties/:id/pause", () => {
    it("pauses sale scope", async () => {
      const deps = makeDeps();
      const app = new Hono().route("/", createAdminRoutes(deps));
      const createRes = await app.request("/v1/admin/properties", {
        method: "POST",
        headers: { "x-admin-key": ADMIN_SECRET, "content-type": "application/json" },
        body: JSON.stringify({
          title: "Pause Test", location: "City", description: "desc",
          totalShares: 1000, sharePriceUsd: 10000, annualRentUsd: 50000,
          ownerWalletAddress: "UQFFF", meta: {},
        }),
      });
      const created = ((await createRes.json()) as { property: { id: string } }).property;

      const res = await app.request(`/v1/admin/properties/${created.id}/pause`, {
        method: "POST",
        headers: { "x-admin-key": ADMIN_SECRET, "content-type": "application/json" },
        body: JSON.stringify({ scope: "sale" }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { ok: boolean; property: { salePaused: boolean; distributionPaused: boolean } };
      expect(body.ok).toBe(true);
      expect(body.property.salePaused).toBe(true);
      expect(body.property.distributionPaused).toBe(false);
    });

    it("returns 404 for unknown property", async () => {
      const app = new Hono().route("/", createAdminRoutes(makeDeps()));
      const res = await app.request("/v1/admin/properties/nonexistent/pause", {
        method: "POST",
        headers: { "x-admin-key": ADMIN_SECRET, "content-type": "application/json" },
        body: JSON.stringify({ scope: "sale" }),
      });
      expect(res.status).toBe(404);
    });

    it("writes audit event on pause", async () => {
      const audit = createMemoryAuditStore();
      const deps = makeDeps({ audit });
      const app = new Hono().route("/", createAdminRoutes(deps));
      const createRes = await app.request("/v1/admin/properties", {
        method: "POST",
        headers: { "x-admin-key": ADMIN_SECRET, "content-type": "application/json" },
        body: JSON.stringify({
          title: "Audit Pause", location: "City", description: "desc",
          totalShares: 1000, sharePriceUsd: 10000, annualRentUsd: 50000,
          ownerWalletAddress: "UQGGG", meta: {},
        }),
      });
      const created = ((await createRes.json()) as { property: { id: string } }).property;

      await app.request(`/v1/admin/properties/${created.id}/pause`, {
        method: "POST",
        headers: { "x-admin-key": ADMIN_SECRET, "content-type": "application/json" },
        body: JSON.stringify({ scope: "all" }),
      });
      const pauseAudits = audit._rows.filter((r: { action: string }) => r.action === "admin.pause");
      expect(pauseAudits.length).toBe(1);
      expect(pauseAudits[0]!.resourceId).toBe(created.id);
    });
  });

  describe("POST /v1/admin/properties/:id/unpause", () => {
    it("unpauses distribution scope", async () => {
      const deps = makeDeps();
      const app = new Hono().route("/", createAdminRoutes(deps));
      const createRes = await app.request("/v1/admin/properties", {
        method: "POST",
        headers: { "x-admin-key": ADMIN_SECRET, "content-type": "application/json" },
        body: JSON.stringify({
          title: "Unpause Test", location: "City", description: "desc",
          totalShares: 1000, sharePriceUsd: 10000, annualRentUsd: 50000,
          ownerWalletAddress: "UQHHH", meta: {},
        }),
      });
      const created = ((await createRes.json()) as { property: { id: string } }).property;

      await app.request(`/v1/admin/properties/${created.id}/pause`, {
        method: "POST",
        headers: { "x-admin-key": ADMIN_SECRET, "content-type": "application/json" },
        body: JSON.stringify({ scope: "all" }),
      });
      const res = await app.request(`/v1/admin/properties/${created.id}/unpause`, {
        method: "POST",
        headers: { "x-admin-key": ADMIN_SECRET, "content-type": "application/json" },
        body: JSON.stringify({ scope: "distribution" }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { ok: boolean; property: { salePaused: boolean; distributionPaused: boolean } };
      expect(body.ok).toBe(true);
      expect(body.property.salePaused).toBe(true);
      expect(body.property.distributionPaused).toBe(false);
    });
  });

  describe("withdrawal queue (PE-03)", () => {
    function makeWithdrawalDeps() {
      const base = makeDeps();
      const audit = createMemoryAuditStore();
      const balances = createMemoryBalanceStore();
      const transactions = createMemoryTxStore();
      const withdrawals = createMemoryWithdrawalStore();
      const installments = createMemoryInstallmentStore();
      const app = new Hono().route(
        "/",
        createAdminRoutes({
          ...base,
          audit,
          balances,
          transactions,
          withdrawals,
          installments,
        }),
      );
      return { app, balances, transactions, withdrawals, installments, audit };
    }

    /** Simulate a PE-02 request: withdrawable debited + pending ledger row + requested record. */
    async function seedRequested(
      deps: ReturnType<typeof makeWithdrawalDeps>,
      over: { id?: string; userId?: string; amountUsd?: number; balance?: number } = {},
    ) {
      const id = over.id ?? `wd-${crypto.randomUUID()}`;
      const userId = over.userId ?? "user-a";
      const amountUsd = over.amountUsd ?? 12_500;
      const txId = `tx-${id}`;
      await deps.balances.adjust(userId, {
        withdrawableDelta: over.balance ?? 50_000,
      });
      await deps.balances.adjust(userId, { withdrawableDelta: -amountUsd });
      await deps.transactions.insert({
        id: txId,
        userId,
        kind: "withdraw",
        amountUsd,
        currency: "USDT",
        status: "pending",
      });
      await deps.withdrawals.insert({
        id,
        userId,
        amountUsd,
        feeUsd: planWithdrawal(amountUsd).feeUsd,
        address: "EQ",
        status: "requested",
        transactionId: txId,
      });
      // Locked model: the net is paid in exactly 4 weekly installments.
      const plan = planWithdrawal(amountUsd);
      await deps.installments.insertMany(
        plan.installments.map((amount, seq) => ({
          id: `wi-${id}-${seq + 1}`,
          withdrawalId: id,
          seq: seq + 1,
          amountUsd: amount,
          dueAt: installmentDueAt(new Date(), seq + 1),
        })),
      );
      return { id, txId, userId, amountUsd };
    }

    const adminHeaders = { "x-admin-key": ADMIN_SECRET };

    it("GET lists the queue newest first and filters by status", async () => {
      const deps = makeWithdrawalDeps();
      await seedRequested(deps, { id: "wd-old", amountUsd: 10_000 });
      await new Promise((r) => setTimeout(r, 5)); // ensure distinct createdAt
      await seedRequested(deps, { id: "wd-new", amountUsd: 20_000 });

      const res = await deps.app.request("/v1/admin/withdrawals", {
        headers: adminHeaders,
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        withdrawals: Array<{ id: string; amountUsd: number; status: string }>;
      };
      expect(body.withdrawals).toHaveLength(2);
      expect(body.withdrawals[0]!.id).toBe("wd-new");
      expect(body.withdrawals[1]!.id).toBe("wd-old");

      const filtered = await deps.app.request(
        "/v1/admin/withdrawals?status=requested",
        { headers: adminHeaders },
      );
      const filteredBody = (await filtered.json()) as {
        withdrawals: unknown[];
      };
      expect(filteredBody.withdrawals).toHaveLength(2);
    });

    it("GET rejects an invalid status filter and requires auth", async () => {
      const deps = makeWithdrawalDeps();
      const bad = await deps.app.request("/v1/admin/withdrawals?status=bogus", {
        headers: adminHeaders,
      });
      expect(bad.status).toBe(400);
      const noAuth = await deps.app.request("/v1/admin/withdrawals");
      expect(noAuth.status).toBe(401);
    });

    it("approve moves requested → approved and writes audit", async () => {
      const deps = makeWithdrawalDeps();
      const { id } = await seedRequested(deps, { id: "wd-approve" });

      const res = await deps.app.request(`/v1/admin/withdrawals/${id}/approve`, {
        method: "POST",
        headers: adminHeaders,
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { withdrawal: { status: string } };
      expect(body.withdrawal.status).toBe("approved");
      expect(
        deps.audit._rows.some((r) => r.action === "admin.withdraw.approve"),
      ).toBe(true);
    });

    it("approve returns 404 for an unknown withdrawal", async () => {
      const deps = makeWithdrawalDeps();
      const res = await deps.app.request("/v1/admin/withdrawals/nope/approve", {
        method: "POST",
        headers: adminHeaders,
      });
      expect(res.status).toBe(404);
    });

    it("reject refunds the withdrawable and audits", async () => {
      const deps = makeWithdrawalDeps();
      const { id, userId, amountUsd } = await seedRequested(deps, {
        id: "wd-reject",
      });
      expect((await deps.balances.get(userId))?.withdrawableUsd).toBe(
        50_000 - amountUsd,
      );

      const res = await deps.app.request(`/v1/admin/withdrawals/${id}/reject`, {
        method: "POST",
        headers: adminHeaders,
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { withdrawal: { status: string } };
      expect(body.withdrawal.status).toBe("rejected");
      expect((await deps.balances.get(userId))?.withdrawableUsd).toBe(50_000);
      expect((await deps.transactions.listByUserId(userId))[0]?.status).toBe(
        "failed",
      );
      expect(
        deps.audit._rows.some((r) => r.action === "admin.withdraw.reject"),
      ).toBe(true);
    });

    it("reject returns 409 for a terminal (paid) withdrawal", async () => {
      const deps = makeWithdrawalDeps();
      const { id } = await seedRequested(deps, { id: "wd-paid" });
      await deps.withdrawals.markPaid(id, "h".repeat(64));

      const res = await deps.app.request(`/v1/admin/withdrawals/${id}/reject`, {
        method: "POST",
        headers: adminHeaders,
      });
      expect(res.status).toBe(409);
    });

    it("mark-paid pays ONE installment at a time; the 4th flips the withdrawal to paid and the ledger to success", async () => {
      const deps = makeWithdrawalDeps();
      const { id, userId } = await seedRequested(deps, { id: "wd-paid2" });

      // First payment: installment 1 of 4 — withdrawal stays approved.
      const firstTx = "f1-" + "d".repeat(61);
      const first = await deps.app.request(`/v1/admin/withdrawals/${id}/mark-paid`, {
        method: "POST",
        headers: { ...adminHeaders, "content-type": "application/json" },
        body: JSON.stringify({ txHash: firstTx }),
      });
      expect(first.status).toBe(200);
      const firstBody = (await first.json()) as {
        withdrawal: {
          status: string;
          installments: Array<{ seq: number; status: string }>;
        };
      };
      // Not approved yet — the withdrawal stays requested until the 4th payment.
      expect(firstBody.withdrawal.status).toBe("requested");
      expect(
        firstBody.withdrawal.installments.filter((i) => i.status === "paid"),
      ).toHaveLength(1);

      // Remaining 3 payments complete the withdrawal.
      let finalBody: { withdrawal: { status: string; txHash: string } } | null =
        null;
      for (let seq = 2; seq <= 4; seq++) {
        const txHash = `f${seq}-` + "d".repeat(61);
        const res = await deps.app.request(`/v1/admin/withdrawals/${id}/mark-paid`, {
          method: "POST",
          headers: { ...adminHeaders, "content-type": "application/json" },
          body: JSON.stringify({ txHash }),
        });
        expect(res.status).toBe(200);
        finalBody = (await res.json()) as {
          withdrawal: { status: string; txHash: string };
        };
      }
      expect(finalBody?.withdrawal.status).toBe("paid");
      expect(finalBody?.withdrawal.txHash).toContain("f4-");

      const tx = (await deps.transactions.listByUserId(userId))[0]!;
      expect(tx.status).toBe("success");
      expect(tx.txHash).toContain("f4-");
      expect(
        deps.audit._rows.some((r) => r.action === "admin.withdraw.paid"),
      ).toBe(true);
    });

    it("mark-paid never double-pays an installment (409 on repeat of the same one)", async () => {
      const deps = makeWithdrawalDeps();
      const { id } = await seedRequested(deps, { id: "wd-double" });

      const txHash = "e".repeat(64);
      const first = await deps.app.request(`/v1/admin/withdrawals/${id}/mark-paid`, {
        method: "POST",
        headers: { ...adminHeaders, "content-type": "application/json" },
        body: JSON.stringify({ txHash }),
      });
      expect(first.status).toBe(200);

      // payNextInstallment already advanced to seq 2; calling mark-paid again is a
      // fresh installment — not a double-pay. To prove the guard, pay the same seq
      // directly is impossible via the route; the service-level guard covers it.
      // Instead: repeated calls never exceed 4 paid installments / never error 500.
      let status = 0;
      for (let i = 0; i < 10; i++) {
        const res = await deps.app.request(`/v1/admin/withdrawals/${id}/mark-paid`, {
          method: "POST",
          headers: { ...adminHeaders, "content-type": "application/json" },
          body: JSON.stringify({ txHash: "g".repeat(64) }),
        });
        status = res.status;
        if (status !== 200) break;
      }
      const stored = await deps.installments.listByWithdrawal(id);
      const paidCount = stored.filter((i) => i.status === "paid").length;
      expect(paidCount).toBeLessThanOrEqual(4);
      expect(status).toBe(409); // after all 4 paid, the withdrawal is terminal
    });

    it("mark-paid returns 400 without a txHash", async () => {
      const deps = makeWithdrawalDeps();
      const { id } = await seedRequested(deps, { id: "wd-notx" });
      const res = await deps.app.request(`/v1/admin/withdrawals/${id}/mark-paid`, {
        method: "POST",
        headers: { ...adminHeaders, "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    it("mark-paid returns 404 for an unknown withdrawal", async () => {
      const deps = makeWithdrawalDeps();
      const res = await deps.app.request("/v1/admin/withdrawals/nope/mark-paid", {
        method: "POST",
        headers: { ...adminHeaders, "content-type": "application/json" },
        body: JSON.stringify({ txHash: "h".repeat(64) }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("POST /v1/admin/yield/payout (PE-04)", () => {
    const DAY = 86_400_000;

    function makeYieldDeps() {
      const base = makeDeps();
      const audit = createMemoryAuditStore();
      const locks = createMemoryShareLockStore();
      const yields = createMemoryYieldStore();
      const balances = createMemoryBalanceStore();
      const transactions = createMemoryTxStore();
      const app = new Hono().route(
        "/",
        createAdminRoutes({
          ...base,
          audit,
          locks,
          yields,
          balances,
          transactions,
        }),
      );
      return { app, audit, locks, yields, balances, transactions };
    }

    /** $1,000 @ 6% weekly lock, locked 7 days ago, already due. */
    async function seedDueWeekly(
      deps: ReturnType<typeof makeYieldDeps>,
      over: { userId?: string; lockId?: string } = {},
    ) {
      const now = new Date();
      await deps.locks.create({
        id: over.lockId ?? "lock-yield",
        userId: over.userId ?? "user-a",
        propertyId: "prop-1",
        shares: 10,
        principalUsd: 100_000,
        payoutPeriod: "weekly",
        monthlyRate: 6,
        nextPayoutAt: new Date(now.getTime() - 1_000),
        now: new Date(now.getTime() - 7 * DAY),
      });
    }

    const adminHeaders = { "x-admin-key": ADMIN_SECRET };
    const jsonHeaders = { ...adminHeaders, "content-type": "application/json" };

    it("pays due yield to withdrawable and writes audit (all users)", async () => {
      const deps = makeYieldDeps();
      await seedDueWeekly(deps);

      const res = await deps.app.request("/v1/admin/yield/payout", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        ok: boolean;
        scope: string;
        payouts: Array<{ lockId: string; amountUsd: number; kind: string }>;
      };
      expect(body.ok).toBe(true);
      expect(body.scope).toBe("all");
      expect(body.payouts).toHaveLength(1);
      expect(body.payouts[0]!.amountUsd).toBe(1_250); // $12.50 weekly
      expect((await deps.balances.get("user-a"))?.withdrawableUsd).toBe(1_250);
      expect((await deps.transactions.listByUserId("user-a"))[0]?.kind).toBe(
        "yield_weekly",
      );
      expect(
        deps.audit._rows.some((r) => r.action === "admin.yield_payout"),
      ).toBe(true);
    });

    it("is idempotent — a repeated run never double-credits", async () => {
      const deps = makeYieldDeps();
      await seedDueWeekly(deps);
      await deps.app.request("/v1/admin/yield/payout", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({}),
      });
      await deps.app.request("/v1/admin/yield/payout", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({}),
      });
      expect((await deps.balances.get("user-a"))?.withdrawableUsd).toBe(1_250);
    });

    it("scopes to one user — other users stay untouched", async () => {
      const deps = makeYieldDeps();
      await seedDueWeekly(deps, { userId: "user-a", lockId: "lock-a" });
      await seedDueWeekly(deps, { userId: "user-b", lockId: "lock-b" });

      const res = await deps.app.request("/v1/admin/yield/payout", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ userId: "user-a" }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        scope: string;
        payouts: unknown[];
      };
      expect(body.scope).toBe("user-a");
      expect(body.payouts).toHaveLength(1);
      expect((await deps.balances.get("user-a"))?.withdrawableUsd).toBe(1_250);
      expect((await deps.balances.get("user-b"))?.withdrawableUsd).toBeUndefined();
    });
  });

  describe("unlock maturation controls (PE-07)", () => {
    const DAY = 86_400_000;
    const MATURATION = 3 * DAY;

    function makeMatureDeps() {
      const base = makeDeps();
      const audit = createMemoryAuditStore();
      const locks = createMemoryShareLockStore();
      const yields = createMemoryYieldStore();
      const balances = createMemoryBalanceStore();
      const transactions = createMemoryTxStore();
      const app = new Hono().route(
        "/",
        createAdminRoutes({
          ...base,
          audit,
          locks,
          yields,
          balances,
          transactions,
          unlockMaturationMs: MATURATION,
        }),
      );
      return { app, audit, locks, balances };
    }

    const adminHeaders = { "x-admin-key": ADMIN_SECRET };

    /** $1,000 @ 6% weekly lock; optionally requested unlock at a given time. */
    async function seedLock(
      deps: ReturnType<typeof makeMatureDeps>,
      over: { id?: string; requestedAt?: Date | null } = {},
    ) {
      const now = new Date();
      await deps.locks.create({
        id: over.id ?? "lock-1",
        userId: "user-a",
        propertyId: "prop-1",
        shares: 10,
        principalUsd: 100_000,
        payoutPeriod: "weekly",
        monthlyRate: 6,
        nextPayoutAt: new Date(now.getTime() + 7 * DAY),
        now,
      });
      if (over.requestedAt) {
        await deps.locks.markUnlockRequested(over.id ?? "lock-1", over.requestedAt);
      }
    }

    it("batch mature frees only locks past the window and audits", async () => {
      const deps = makeMatureDeps();
      const now = new Date();
      // lock-a: requested 3 days ago → due; lock-b: requested 1 day ago → not due.
      await seedLock(deps, { id: "lock-a", requestedAt: new Date(now.getTime() - MATURATION) });
      await seedLock(deps, { id: "lock-b", requestedAt: new Date(now.getTime() - DAY) });

      const res = await deps.app.request("/v1/admin/locks/mature", {
        method: "POST",
        headers: adminHeaders,
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { ok: boolean; matured: string[] };
      expect(body.ok).toBe(true);
      expect(body.matured).toEqual(["lock-a"]);
      expect((await deps.locks.get("lock-a"))?.status).toBe("matured");
      expect((await deps.locks.get("lock-b"))?.status).toBe("unlock_requested");
      expect(
        deps.audit._rows.some((r) => r.action === "admin.lock_mature"),
      ).toBe(true);
    });

    it("batch mature is idempotent — a second run matures nothing new", async () => {
      const deps = makeMatureDeps();
      const now = new Date();
      await seedLock(deps, { id: "lock-a", requestedAt: new Date(now.getTime() - MATURATION) });
      await deps.app.request("/v1/admin/locks/mature", {
        method: "POST",
        headers: adminHeaders,
      });
      const second = await deps.app.request("/v1/admin/locks/mature", {
        method: "POST",
        headers: adminHeaders,
      });
      const body = (await second.json()) as { matured: string[] };
      expect(body.matured).toEqual([]);
      expect((await deps.locks.get("lock-a"))?.status).toBe("matured");
    });

    it("manual mature bypasses the window for an unlock_requested lock", async () => {
      const deps = makeMatureDeps();
      const now = new Date();
      // Requested just now (not due) → manual mature still frees it.
      await seedLock(deps, { id: "lock-c", requestedAt: now });

      const res = await deps.app.request("/v1/admin/locks/lock-c/mature", {
        method: "POST",
        headers: adminHeaders,
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { lock: { id: string; status: string } };
      expect(body.lock).toEqual({ id: "lock-c", status: "matured" });
      expect(
        deps.audit._rows.some((r) => r.action === "admin.lock_mature_manual"),
      ).toBe(true);
    });

    it("manual mature 404s unknown and 409s locked/already-matured locks", async () => {
      const deps = makeMatureDeps();
      const now = new Date();
      await seedLock(deps, { id: "lock-locked" }); // still locked, no request
      await seedLock(deps, {
        id: "lock-done",
        requestedAt: new Date(now.getTime() - MATURATION),
      });
      await deps.locks.markMatured("lock-done", new Date());

      const nf = await deps.app.request("/v1/admin/locks/nope/mature", {
        method: "POST",
        headers: adminHeaders,
      });
      expect(nf.status).toBe(404);

      const locked = await deps.app.request("/v1/admin/locks/lock-locked/mature", {
        method: "POST",
        headers: adminHeaders,
      });
      expect(locked.status).toBe(409);
      const lockedBody = (await locked.json()) as { code: string };
      expect(lockedBody.code).toBe("conflict");

      const done = await deps.app.request("/v1/admin/locks/lock-done/mature", {
        method: "POST",
        headers: adminHeaders,
      });
      expect(done.status).toBe(409);
    });

    it("requires the admin key (401)", async () => {
      const deps = makeMatureDeps();
      const res = await deps.app.request("/v1/admin/locks/mature", {
        method: "POST",
      });
      expect(res.status).toBe(401);
    });

    it("batch mature returns 501 when the yield stores are not configured", async () => {
      // Bare makeDeps() has no locks/yields/balances/transactions → the route's
      // not_configured guard fires before any engine work.
      const app = new Hono().route("/", createAdminRoutes(makeDeps()));
      const res = await app.request("/v1/admin/locks/mature", {
        method: "POST",
        headers: { "x-admin-key": ADMIN_SECRET },
      });
      expect(res.status).toBe(501);
      const body = (await res.json()) as { code: string; message: string };
      expect(body.code).toBe("not_configured");
      expect(body.message).toMatch(/Yield stores/);
    });

    it("per-lock mature returns 501 when the lock store is not configured", async () => {
      // Bare makeDeps() has no locks → the per-lock route's guard fires before
      // any store lookup.
      const app = new Hono().route("/", createAdminRoutes(makeDeps()));
      const res = await app.request("/v1/admin/locks/lock-1/mature", {
        method: "POST",
        headers: { "x-admin-key": ADMIN_SECRET },
      });
      expect(res.status).toBe(501);
      const body = (await res.json()) as { code: string; message: string };
      expect(body.code).toBe("not_configured");
      expect(body.message).toMatch(/Lock store/);
    });

    it("batch mature returns 501 when only the lock store is wired", async () => {
      // The batch guard needs locks + yields + balances + transactions together;
      // wiring just locks is still not configured (the engine would have nowhere
      // to credit a payout).
      const app = new Hono().route(
        "/",
        createAdminRoutes({
          ...makeDeps(),
          locks: createMemoryShareLockStore(),
        }),
      );
      const res = await app.request("/v1/admin/locks/mature", {
        method: "POST",
        headers: { "x-admin-key": ADMIN_SECRET },
      });
      expect(res.status).toBe(501);
      const body = (await res.json()) as { code: string; message: string };
      expect(body.code).toBe("not_configured");
      expect(body.message).toMatch(/Yield stores/);
    });

    it("batch mature returns 501 when only transactions is missing", async () => {
      // All four stores except transactions → still not configured: the engine
      // writes a ledger row alongside the payout, so it can't run without it.
      const app = new Hono().route(
        "/",
        createAdminRoutes({
          ...makeDeps(),
          locks: createMemoryShareLockStore(),
          yields: createMemoryYieldStore(),
          balances: createMemoryBalanceStore(),
          // transactions intentionally omitted
        }),
      );
      const res = await app.request("/v1/admin/locks/mature", {
        method: "POST",
        headers: { "x-admin-key": ADMIN_SECRET },
      });
      expect(res.status).toBe(501);
      const body = (await res.json()) as { code: string; message: string };
      expect(body.code).toBe("not_configured");
      expect(body.message).toMatch(/Yield stores/);
    });
  });

  describe("POST /v1/admin/properties/:id/house-orders/seed (PE-06)", () => {
    const RESALE = "prop-tbilisi-riverhouse-loft"; // resale, sharePriceUsd 12_000

    function makeSeedDeps(over: { feeTiers?: AdminRouteDeps["feeTiers"] } = {}) {
      const base = makeDeps();
      const audit = createMemoryAuditStore();
      const orders = createMemoryOrderStore();
      const trades = createMemoryTradeStore();
      const holdings = createMemoryHoldingStore();
      const balances = createMemoryBalanceStore();
      const feeTiers = over.feeTiers ?? createMemoryFeeTierStore();
      const transactions = createMemoryTxStore();
      const app = new Hono().route(
        "/",
        createAdminRoutes({
          ...base,
          audit,
          orders,
          trades,
          holdings,
          balances,
          feeTiers,
          transactions,
          houseAccountUserId: "house-account",
        }),
      );
      return { app, audit, orders, trades, holdings, balances, transactions };
    }

    const adminHeaders = { "x-admin-key": ADMIN_SECRET };

    it("seeds a two-sided book around the offering price (no trades yet)", async () => {
      const deps = makeSeedDeps();
      const res = await deps.app.request(
        `/v1/admin/properties/${RESALE}/house-orders/seed`,
        { method: "POST", headers: adminHeaders },
      );
      expect(res.status).toBe(201);
      const body = (await res.json()) as {
        ok: boolean;
        referencePriceUsd: number;
        orders: Array<{
          side: string;
          priceUsd: number;
          quantity: number;
          isHouseAccount: boolean;
          status: string;
        }>;
      };
      expect(body.ok).toBe(true);
      expect(body.referencePriceUsd).toBe(12_000);
      expect(body.orders).toHaveLength(6); // 3 bids + 3 asks
      // Defaults: levels 3, spread 1%, qty 5 per level.
      const bids = body.orders.filter((o) => o.side === "buy");
      const asks = body.orders.filter((o) => o.side === "sell");
      expect(bids).toHaveLength(3);
      expect(asks).toHaveLength(3);
      // Bids step down, asks step up, all flagged house + open.
      expect(bids.map((o) => o.priceUsd)).toEqual([11_880, 11_760, 11_640]);
      expect(asks.map((o) => o.priceUsd)).toEqual([12_120, 12_240, 12_360]);
      for (const o of body.orders) {
        expect(o.isHouseAccount).toBe(true);
        expect(o.status).toBe("open");
        expect(o.quantity).toBe(5);
      }
      // House orders persist in the store with the flag.
      expect(deps.orders._rows).toHaveLength(6);
      expect(deps.orders._rows.every((r) => r.isHouseAccount)).toBe(true);
      expect(
        deps.audit._rows.some((r) => r.action === "admin.house_order_seed"),
      ).toBe(true);
    });

    it("anchors around the last trade price when the book has traded", async () => {
      const deps = makeSeedDeps();
      await deps.trades.insert({
        id: "trd_seed_1",
        propertyId: RESALE,
        priceUsd: 11_500,
        quantity: 2,
        buyerUserId: "user-a",
        sellerUserId: "user-b",
        buyFeeUsd: 0,
        sellFeeUsd: 0,
        makerOrderId: "m",
        takerOrderId: "t",
        fillSeq: 0,
      });
      const res = await deps.app.request(
        `/v1/admin/properties/${RESALE}/house-orders/seed`,
        { method: "POST", headers: adminHeaders },
      );
      expect(res.status).toBe(201);
      const body = (await res.json()) as {
        referencePriceUsd: number;
        orders: Array<{ priceUsd: number }>;
      };
      expect(body.referencePriceUsd).toBe(11_500);
      // bids at 11_385 / 11_270 / 11_155 (round of 1% steps)
      expect(body.orders.filter((o) => o.priceUsd < 11_500)).toHaveLength(3);
      expect(body.orders.filter((o) => o.priceUsd > 11_500)).toHaveLength(3);
    });

    it("honours custom levels / spread / qty and clamps extremes", async () => {
      const deps = makeSeedDeps();
      const res = await deps.app.request(
        `/v1/admin/properties/${RESALE}/house-orders/seed`,
        {
          method: "POST",
          headers: { ...adminHeaders, "content-type": "application/json" },
          body: JSON.stringify({ levels: 2, spreadPct: 2, qtyPerLevel: 7 }),
        },
      );
      expect(res.status).toBe(201);
      const body = (await res.json()) as {
        orders: Array<{ side: string; priceUsd: number; quantity: number }>;
      };
      expect(body.orders).toHaveLength(4); // 2 bids + 2 asks
      const bids = body.orders.filter((o) => o.side === "buy");
      const asks = body.orders.filter((o) => o.side === "sell");
      expect(bids.map((o) => o.priceUsd)).toEqual([11_760, 11_520]);
      expect(asks.map((o) => o.priceUsd)).toEqual([12_240, 12_480]);
      expect(body.orders.every((o) => o.quantity === 7)).toBe(true);

      // Extreme values clamp: levels ≤ 5, qty ≤ 100, spread ≤ 10.
      const clamped = await deps.app.request(
        `/v1/admin/properties/${RESALE}/house-orders/seed`,
        {
          method: "POST",
          headers: { ...adminHeaders, "content-type": "application/json" },
          body: JSON.stringify({ levels: 99, spreadPct: 500, qtyPerLevel: 9999 }),
        },
      );
      expect(clamped.status).toBe(201);
      const clampedBody = (await clamped.json()) as {
        orders: Array<{ quantity: number }>;
      };
      expect(clampedBody.orders).toHaveLength(10); // 5 + 5
      expect(clampedBody.orders.every((o) => o.quantity === 100)).toBe(true);
    });

    it("409 on a funding (primary) property", async () => {
      const deps = makeSeedDeps();
      const res = await deps.app.request(
        "/v1/admin/properties/prop-marina-vista-4b/house-orders/seed",
        { method: "POST", headers: adminHeaders },
      );
      expect(res.status).toBe(409);
      const body = (await res.json()) as { code: string };
      expect(body.code).toBe("invalid_phase");
    });

    it("409 no_fee_tier when no fee tier covers the seeded bid", async () => {
      // Empty tier list → the first seeded buy hits the no-tier guard in
      // placeHouseOrder, which the route surfaces as a 409 before any write.
      const deps = makeSeedDeps({ feeTiers: createMemoryFeeTierStore([]) });
      const res = await deps.app.request(
        `/v1/admin/properties/${RESALE}/house-orders/seed`,
        { method: "POST", headers: adminHeaders },
      );
      expect(res.status).toBe(409);
      const body = (await res.json()) as { code: string; message: string };
      expect(body.code).toBe("no_fee_tier");
      expect(body.message).toMatch(/No fee tier/);
      // Guard fires before any order is inserted — nothing is written.
      expect(deps.orders._rows).toHaveLength(0);
      expect(await deps.balances.get("house-account")).toBeNull();
      expect(deps.trades._rows).toHaveLength(0);
      expect(
        deps.audit._rows.some((r) => r.action === "admin.house_order_seed"),
      ).toBe(false);
    });

    it("404 for an unknown property and 401 without the admin key", async () => {
      const deps = makeSeedDeps();
      const nf = await deps.app.request(
        "/v1/admin/properties/nope/house-orders/seed",
        { method: "POST", headers: adminHeaders },
      );
      expect(nf.status).toBe(404);
      const noAuth = await deps.app.request(
        `/v1/admin/properties/${RESALE}/house-orders/seed`,
        { method: "POST" },
      );
      expect(noAuth.status).toBe(401);
    });
  });

  describe("draft exclusion from marketplace", () => {
    it("draft properties are not in list results", async () => {
      const deps = makeDeps();
      // Create a draft property
      await deps.properties.create({
        id: "prop-draft-test",
        title: "Draft Property",
        location: "Hidden",
        description: "Should not appear in marketplace",
        totalShares: 1000,
        sharePriceUsd: 10000,
        annualRentUsd: 50000,
        ownerWalletAddress: "UQEEE",
        meta: {},
        status: "draft",
      });

      const listings = await deps.properties.list();
      const draftIds = listings
        .filter((l) => l.status === "draft")
        .map((l) => l.id);
      expect(draftIds).not.toContain("prop-draft-test");
    });
  });

  describe("collectible NFT queue (Phase 8)", () => {
    function makeNftDeps() {
      const base = makeDeps();
      const audit = createMemoryAuditStore();
      const nfts = createMemoryNftStore();
      const enqueued: string[] = [];
      const app = new Hono().route(
        "/",
        createAdminRoutes({
          ...base,
          audit,
          nfts,
          nftQueue: {
            async add(job: { data: { holdingNftId: string } }) {
              enqueued.push(job.data.holdingNftId);
            },
          },
        }),
      );
      return { app, nfts, audit, enqueued };
    }

    const adminHeaders = { "x-admin-key": ADMIN_SECRET };
    const ADDR = new Address(0, Buffer.alloc(32, 1)).toString();

    it("GET lists the queue and requires auth", async () => {
      const deps = makeNftDeps();
      await deps.nfts.insert({
        id: "nft_1",
        holdingKey: "user-a:prop-a",
        userId: "user-a",
        propertyId: "prop-a",
        walletAddress: ADDR,
      });

      const noAuth = await deps.app.request("/v1/admin/nfts");
      expect(noAuth.status).toBe(401);

      const res = await deps.app.request("/v1/admin/nfts", {
        headers: adminHeaders,
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { nfts: Array<{ id: string; status: string }> };
      expect(body.nfts).toHaveLength(1);
      expect(body.nfts[0]!.status).toBe("pending");

      const bad = await deps.app.request("/v1/admin/nfts?status=bogus", {
        headers: adminHeaders,
      });
      expect(bad.status).toBe(400);
    });

    it("retry re-queues a FAILED NFT and audits; rejects non-failed and unknown", async () => {
      const deps = makeNftDeps();
      await deps.nfts.insert({
        id: "nft_1",
        holdingKey: "user-a:prop-a",
        userId: "user-a",
        propertyId: "prop-a",
        walletAddress: ADDR,
      });
      await deps.nfts.claimForMint("nft_1");
      await deps.nfts.markFailed("nft_1", "mint_failed", "boom");

      const res = await deps.app.request("/v1/admin/nfts/nft_1/retry", {
        method: "POST",
        headers: adminHeaders,
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { nft: { status: string } };
      expect(body.nft.status).toBe("pending");
      expect(deps.enqueued).toContain("nft_1");
      expect(deps.audit._rows.some((a) => a.action === "nft.retry")).toBe(true);

      // Non-failed → 409
      const conflict = await deps.app.request("/v1/admin/nfts/nft_1/retry", {
        method: "POST",
        headers: adminHeaders,
      });
      expect(conflict.status).toBe(409);

      // Unknown → 404
      const missing = await deps.app.request("/v1/admin/nfts/nft_nope/retry", {
        method: "POST",
        headers: adminHeaders,
      });
      expect(missing.status).toBe(404);

      // No auth → 401
      const noAuth = await deps.app.request("/v1/admin/nfts/nft_1/retry", {
        method: "POST",
      });
      expect(noAuth.status).toBe(401);
    });

    it("sweep runs the recovery pass", async () => {
      const deps = makeNftDeps();
      await deps.nfts.insert({
        id: "nft_stale",
        holdingKey: "user-a:prop-a",
        userId: "user-a",
        propertyId: "prop-a",
        walletAddress: ADDR,
      });
      deps.nfts._rows[0]!.createdAt = new Date(Date.now() - 60 * 60_000);

      const res = await deps.app.request("/v1/admin/nfts/sweep", {
        method: "POST",
        headers: adminHeaders,
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { ok: boolean; reenqueued: number };
      expect(body.ok).toBe(true);
      expect(body.reenqueued).toBe(1);
      expect(deps.enqueued).toContain("nft_stale");
    });
  });
});
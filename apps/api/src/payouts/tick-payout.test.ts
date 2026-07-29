import { describe, expect, it } from "vitest";
import { createMemoryAuditStore } from "../audit/audit-store.js";
import {
  createMemoryEarningsStore,
  type EarningsEntryRowInput,
} from "../earnings/earnings-store.js";
import { buildEarningsSummary } from "../earnings/map-earnings.js";
import {
  createMemoryDistributionStore,
  type DistributionRecord,
} from "./distribution-store.js";
import { createMemoryPayoutTickStore } from "./payout-tick-store.js";
import {
  syntheticPayoutTxHash,
  tickPayout,
  tickPayoutDue,
  type TickPayoutDeps,
} from "./tick-payout.js";

const DIST_ID = "dist-bayside-2026-07-20";
const PROP = "prop-bayside-marina-penthouse";
const WEEK = "2026-07-20";

function makeDist(
  over: Partial<DistributionRecord> = {},
): DistributionRecord {
  return {
    id: DIST_ID,
    propertyId: PROP,
    weekOf: WEEK,
    rentPoolUsd: 20_000,
    rentPoolNanoTon: 20_000 * 5_000_000,
    payoutDay: "2026-07-23",
    status: "distributing",
    totalShares: 800,
    createdAt: new Date("2026-07-20T00:00:00Z"),
    ...over,
  };
}

function pendingEntry(
  id: string,
  userId: string,
  amountUsd: number,
): EarningsEntryRowInput {
  return {
    id,
    userId,
    propertyId: PROP,
    distributionId: DIST_ID,
    weekOf: `${WEEK}T00:00:00Z`,
    amountUsd,
    tonAmount: amountUsd * 5_000_000,
    shareRatio: 0.2,
    status: "pending",
    txHash: null,
  };
}

function makeDeps(
  entries: EarningsEntryRowInput[] = [
    pendingEntry("earn-a", "user-a", 4000),
    pendingEntry("earn-b", "user-b", 4000),
  ],
  dist: DistributionRecord = makeDist(),
): TickPayoutDeps & {
  earnings: ReturnType<typeof createMemoryEarningsStore>;
  distributions: ReturnType<typeof createMemoryDistributionStore>;
  audit: ReturnType<typeof createMemoryAuditStore>;
} {
  const earnings = createMemoryEarningsStore(entries);
  const distributions = createMemoryDistributionStore([dist]);
  const ticks = createMemoryPayoutTickStore();
  const audit = createMemoryAuditStore();
  return { earnings, distributions, ticks, audit };
}

describe("tickPayout", () => {
  it("flips pending→paid with simulated txHash", async () => {
    const deps = makeDeps();
    const r = await tickPayout(deps, DIST_ID);
    expect("ok" in r && r.ok === false).toBe(false);
    if ("ok" in r) return;
    expect(r.paidEntries).toBe(2);
    expect(r.entryIds).toHaveLength(2);
    expect(r.idempotent).toBe(false);
    expect(r.idempotencyKey).toBe(`${PROP}#${WEEK}`);

    for (const row of deps.earnings._rows) {
      expect(row.status).toBe("paid");
      expect(row.txHash).toBe(syntheticPayoutTxHash(row.id));
      expect(row.txHash?.startsWith("simulated:")).toBe(true);
    }
  });

  it("marks distribution completed when no pending left", async () => {
    const deps = makeDeps();
    await tickPayout(deps, DIST_ID);
    expect(deps.distributions._rows[0]!.status).toBe("completed");
  });

  it("second tick is idempotent (paidEntries 0, hashes unchanged)", async () => {
    const deps = makeDeps();
    const first = await tickPayout(deps, DIST_ID);
    if ("ok" in first) throw new Error("unexpected");
    const hashes = deps.earnings._rows.map((r) => r.txHash);

    const second = await tickPayout(deps, DIST_ID);
    if ("ok" in second) throw new Error("unexpected");
    expect(second.paidEntries).toBe(0);
    expect(second.idempotent).toBe(true);
    expect(deps.earnings._rows.map((r) => r.txHash)).toEqual(hashes);

    const payoutAudits = await deps.audit.listByAction("payout.tick");
    expect(payoutAudits).toHaveLength(1);
    expect(payoutAudits[0]!.actorType).toBe("system");
    expect(payoutAudits[0]!.actorLabel).toBe("tickPayout");
    expect(payoutAudits[0]!.resourceId).toBe(DIST_ID);
    expect(payoutAudits[0]!.payload?.idempotencyKey).toBe(`${PROP}#${WEEK}`);
  });

  it("back-to-back ticks pay once (idempotent insert)", async () => {
    const deps = makeDeps();
    const [a, b] = await Promise.all([
      tickPayout(deps, DIST_ID),
      tickPayout(deps, DIST_ID),
    ]);
    if ("ok" in a || "ok" in b) throw new Error("unexpected");
    const totalPaid = a.paidEntries + b.paidEntries;
    // One wins the key; other is 0. Memory is sync so one should get all.
    expect(totalPaid).toBe(2);
    expect(
      deps.earnings._rows.every((r) => r.status === "paid"),
    ).toBe(true);
  });

  it("earnings summary allTimeUsd includes former pending after tick", async () => {
    const deps = makeDeps([pendingEntry("earn-a", "user-a", 4000)]);
    await tickPayout(deps, DIST_ID);
    const rows = await deps.earnings.listEntriesByUserId("user-a");
    const summary = buildEarningsSummary(rows);
    expect(summary.allTimeUsd).toBe(4000);
    expect(summary.thisWeekProjectedUsd).toBe(0);
    expect(summary.entries[0]!.status).toBe("paid");
  });

  it("missing distribution → not_found", async () => {
    const deps = makeDeps();
    const r = await tickPayout(deps, "dist-missing");
    expect(r).toMatchObject({ ok: false, reason: "not_found" });
  });

  it("tickPayoutDue empty → []", async () => {
    const deps = makeDeps([], makeDist({ status: "completed" }));
    const r = await tickPayoutDue(deps);
    expect(r).toEqual([]);
  });

  it("tickPayoutDue processes open dist with pending", async () => {
    const deps = makeDeps();
    const r = await tickPayoutDue(deps);
    expect(r).toHaveLength(1);
    expect(r[0]!.paidEntries).toBe(2);
  });
});

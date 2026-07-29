import type { AuditStore } from "../audit/audit-store.js";
import { writeAuditEvent } from "../audit/write-audit.js";
import type { EarningsStore } from "../earnings/earnings-store.js";
import type { DistributionStore } from "./distribution-store.js";
import {
  payoutIdempotencyKey,
  type PayoutTickStore,
} from "./payout-tick-store.js";

export type TickPayoutDeps = {
  distributions: DistributionStore;
  earnings: EarningsStore;
  ticks: PayoutTickStore;
  audit?: AuditStore | null;
};

/** Hybrid paid stamp — ADR-001 simulated honesty (no explorer hash). */
export function syntheticPayoutTxHash(entryId: string): string {
  return `simulated:${entryId}`;
}

export type TickPayoutResult = {
  distributionId: string;
  paidEntries: number;
  entryIds: string[];
  idempotent: boolean;
  /** Structured for P1-14 audit_events. */
  idempotencyKey: string;
};

export type TickPayoutError = {
  ok: false;
  reason: "not_found";
  distributionId: string;
};

/**
 * Flip pending→paid for one distribution (hybrid ledger only).
 * Idempotency key = `${propertyId}#${weekOf}` (ADR-003).
 * Does not recompute amounts or move TON.
 */
export async function tickPayout(
  deps: TickPayoutDeps,
  distributionId: string,
): Promise<TickPayoutResult | TickPayoutError> {
  const dist = await deps.distributions.getById(distributionId);
  if (!dist) {
    return { ok: false, reason: "not_found", distributionId };
  }

  const key = payoutIdempotencyKey(dist.propertyId, dist.weekOf);

  if (await deps.ticks.hasKey(key)) {
    return {
      distributionId,
      paidEntries: 0,
      entryIds: [],
      idempotent: true,
      idempotencyKey: key,
    };
  }

  const pendingLeft = await deps.earnings.countPendingByDistribution(
    distributionId,
  );
  if (pendingLeft === 0 && dist.status === "completed") {
    await deps.ticks.tryInsert({
      idempotencyKey: key,
      distributionId,
      paidEntries: 0,
    });
    return {
      distributionId,
      paidEntries: 0,
      entryIds: [],
      idempotent: true,
      idempotencyKey: key,
    };
  }

  const claim = await deps.ticks.tryInsert({
    idempotencyKey: key,
    distributionId,
    paidEntries: 0,
  });
  if (claim === "duplicate") {
    return {
      distributionId,
      paidEntries: 0,
      entryIds: [],
      idempotent: true,
      idempotencyKey: key,
    };
  }

  const { entryIds } = await deps.earnings.markPendingPaidForDistribution({
    distributionId,
    txHashFor: syntheticPayoutTxHash,
  });

  const stillPending =
    await deps.earnings.countPendingByDistribution(distributionId);
  if (stillPending === 0) {
    await deps.distributions.markCompleted(distributionId);
  }

  const paidEntries = entryIds.length;
  if (paidEntries > 0 && deps.audit) {
    const cappedIds =
      entryIds.length > 50 ? entryIds.slice(0, 50) : entryIds;
    await writeAuditEvent(deps.audit, {
      action: "payout.tick",
      actorType: "system",
      actorUserId: null,
      actorLabel: "tickPayout",
      resourceType: "distribution",
      resourceId: distributionId,
      summary: `Payout tick ${distributionId} paid=${paidEntries}`,
      payload: {
        distributionId,
        idempotencyKey: key,
        paidEntries,
        entryIds: cappedIds,
      },
    });
  }

  return {
    distributionId,
    paidEntries,
    entryIds,
    idempotent: paidEntries === 0,
    idempotencyKey: key,
  };
}

/**
 * Process all tickable distributions (scheduled|distributing with pending).
 * Returns one result per distribution attempted.
 */
export async function tickPayoutDue(
  deps: TickPayoutDeps,
): Promise<TickPayoutResult[]> {
  const due = await deps.distributions.listTickable();
  const results: TickPayoutResult[] = [];
  const seen = new Set<string>();

  for (const d of due) {
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    const pending = await deps.earnings.countPendingByDistribution(d.id);
    if (pending === 0) continue;
    const r = await tickPayout(deps, d.id);
    if ("ok" in r && r.ok === false) continue;
    results.push(r as TickPayoutResult);
  }
  return results;
}

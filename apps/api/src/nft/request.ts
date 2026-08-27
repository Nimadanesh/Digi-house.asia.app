// File responsibility: NFT request hook attached to buy settlement (Phase 1 lifecycle).
// BUY SETTLEMENT SUCCESS → HOLDING CREATED/CONFIRMED → NFT MINT JOB → MINTED → SENT → DELIVERED.
// This hook is best-effort and fire-and-forget: it is wrapped in try/catch at the call
// site, can never throw into the buy path, and never rolls back the purchase. If the
// mint/transfer later fails the NFT goes failed (retryable) — the holding is untouched.
// The DB (holdings) remains the source of truth; the NFT is a display-only receipt.
import type { Logger } from "../logger.js";
import type { AuditStore } from "../audit/audit-store.js";
import { writeAuditEvent } from "../audit/write-audit.js";
import type { UserStore } from "../auth/user-store.js";
import type { HoldingNftRecord, NftQueueLike, NftStore } from "./nft-store.js";
import { isValidNftDestinationWallet } from "./minter.js";
import { metadataUrlFor } from "./metadata.js";

export type NftRequestDeps = {
  nfts: NftStore;
  queue: NftQueueLike;
  /** Resolves the fallback delivery wallet when the intent has no payer wallet. */
  users?: UserStore | null;
  metadataBaseUrl?: string;
  collectionAddress?: string | null;
  audit?: AuditStore | null;
  log?: Logger;
};

export type NftRequestInput = {
  userId: string;
  propertyId: string;
  /** The wallet verified with the payment — the delivery destination (Phase 5). */
  paidByWallet: string | null;
};

/**
 * Request a collectible NFT for a settled holding. Idempotent per holding (unique
 * holding_key): a duplicate settlement event never creates a second NFT. Returns the
 * record (created or existing) or null when there is no valid delivery wallet.
 */
export async function requestNftForHolding(
  deps: NftRequestDeps,
  input: NftRequestInput,
): Promise<HoldingNftRecord | null> {
  const wallet =
    input.paidByWallet ??
    (deps.users ? (await deps.users.findById(input.userId))?.walletAddress ?? null : null);
  if (!wallet) {
    deps.log?.warn(
      { userId: input.userId, propertyId: input.propertyId },
      "nft.request.skipped_no_wallet",
    );
    return null;
  }
  if (!isValidNftDestinationWallet(wallet)) {
    deps.log?.warn(
      { userId: input.userId, propertyId: input.propertyId },
      "nft.request.skipped_invalid_wallet",
    );
    return null;
  }

  const id = `nft_${crypto.randomUUID()}`;
  const holdingKey = `${input.userId}:${input.propertyId}`;
  const metadataUrl = metadataUrlFor(deps.metadataBaseUrl ?? "", id);

  const { record, created } = await deps.nfts.insert({
    id,
    holdingKey,
    userId: input.userId,
    propertyId: input.propertyId,
    walletAddress: wallet,
    collectionAddress: deps.collectionAddress ?? null,
    metadataUrl,
  });

  if (created) {
    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "nft.requested",
        actorType: "system",
        actorLabel: "settleVerifiedBuy",
        resourceType: "holding_nft",
        resourceId: record.id,
        summary: `Collectible NFT requested for ${input.propertyId}`,
        payload: {
          nftId: record.id,
          userId: input.userId,
          propertyId: input.propertyId,
          holdingKey,
          walletAddress: wallet,
          metadataUrl,
        },
        requestId: null,
      });
    }
    try {
      await deps.queue.add({ name: "mintNft", data: { holdingNftId: record.id } });
    } catch (err) {
      // Queue unavailable — the record stays pending and the worker's boot/recovery
      // sweep re-enqueues it later. The buy is NOT affected.
      deps.log?.warn(
        { nftId: record.id, err },
        "nft.request.enqueue_failed_will_sweep",
      );
    }
  }

  return record;
}

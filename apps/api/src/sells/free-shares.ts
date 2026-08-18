// File responsibility: shared free-shares computation (§0.3/§0.4). Shares are sellable or
// lockable only when they are neither held by an active lock nor escrowed in an active
// (open/queued) sell order.
import type { HoldingStore } from "../portfolio/holding-store.js";
import type { ShareLockStore } from "../yield/lock-store.js";
import type { OrderStore } from "../orders/order-store.js";

export type FreeSharesDeps = {
  holdings: HoldingStore;
  locks?: ShareLockStore | null;
  orders?: OrderStore | null;
};

export async function computeFreeShares(
  deps: FreeSharesDeps,
  userId: string,
  propertyId: string,
): Promise<number> {
  const holding = await deps.holdings.get(userId, propertyId);
  const owned = holding?.sharesOwned ?? 0;
  const locked = deps.locks
    ? await deps.locks.sumActiveLockedShares(userId, propertyId)
    : 0;
  const escrowed = deps.orders
    ? await deps.orders.sumActiveSellShares(userId, propertyId)
    : 0;
  return Math.max(0, owned - locked - escrowed);
}

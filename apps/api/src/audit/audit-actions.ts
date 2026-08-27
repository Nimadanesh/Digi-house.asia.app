export const AUDIT_ACTIONS = [
  "buy.confirm",
  "buy.verify",
  "buy.settle",
  "property.sellout",
  "order.activate",
  "order.cancel",
  "lock.mature",
  "payout.tick",
  "admin.pause",
  "admin.unpause",
  "admin.create",
  "admin.update",
  "lock.create",
  "lock.unlock_request",
  "order.create",
  "order.trade",
  "sell.instant",
  "withdraw.request",
  "admin.withdraw.approve",
  "admin.withdraw.reject",
  "admin.withdraw.paid",
  "admin.yield_payout",
  "admin.house_order",
  "admin.house_order_seed",
  "admin.lock_mature",
  "admin.lock_mature_manual",
  "nft.requested",
  "nft.mint_started",
  "nft.minted",
  "nft.mint_recovered",
  "nft.transfer_started",
  "nft.delivered",
  "nft.failed",
  "nft.retry",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export function isAuditAction(v: string): v is AuditAction {
  return (AUDIT_ACTIONS as readonly string[]).includes(v);
}

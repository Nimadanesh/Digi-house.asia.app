export const AUDIT_ACTIONS = [
  "buy.confirm",
  "order.cancel",
  "payout.tick",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export function isAuditAction(v: string): v is AuditAction {
  return (AUDIT_ACTIONS as readonly string[]).includes(v);
}

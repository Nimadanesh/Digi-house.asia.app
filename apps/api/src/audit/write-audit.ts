import type { AuditEventInput, AuditStore } from "./audit-store.js";

/**
 * Best-effort audit write. Mutations already committed must not roll back
 * if audit insert fails — log and continue when onError provided.
 */
export async function writeAuditEvent(
  store: AuditStore,
  input: AuditEventInput,
  onError?: (err: unknown) => void,
): Promise<void> {
  try {
    await store.insert(input);
  } catch (err) {
    if (onError) onError(err);
    // fail-open for HTTP after successful business mutation
  }
}

// File responsibility: decoupled 401 → re-auth signal. No React imports.
// HTTP client calls triggerAuthInvalidated() on 401; AuthProvider listens.

export type AuthEventHandler = () => void;

let _handler: AuthEventHandler | null = null;

export function onAuthInvalidated(cb: AuthEventHandler): void {
  _handler = cb;
}

export function triggerAuthInvalidated(): void {
  _handler?.();
}

/** Test-only: reset handler. */
export function __resetAuthEventHandler(): void {
  _handler = null;
}

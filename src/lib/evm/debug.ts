// File responsibility: temporary EVM connection diagnostics (see EVM_DEBUG).
// One flag silences every wallet-routing log when the current connection
// investigation is over. Never gate behavior on this — logging only.
export const EVM_DEBUG = false;

export function evmDebug(...args: unknown[]): void {
  if (EVM_DEBUG) {
    console.debug("[evm]", ...args);
  }
}

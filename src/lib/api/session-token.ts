// File responsibility: in-memory (and optional sessionStorage) bearer token for API calls.
// Filled by P1-16 initData → session. When null, protected endpoints 401 — callers handle.

let token: string | null = null;

export function getApiAccessToken(): string | null {
  return token;
}

export function setApiAccessToken(t: string | null): void {
  token = t;
  if (typeof sessionStorage !== "undefined") {
    if (t) {
      sessionStorage.setItem("digihouse_api_token", t);
    } else {
      sessionStorage.removeItem("digihouse_api_token");
    }
  }
}

// Restore from sessionStorage on cold module load (SSR-safe).
try {
  if (typeof sessionStorage !== "undefined") {
    const stored = sessionStorage.getItem("digihouse_api_token");
    if (stored) token = stored;
  }
} catch {
  // sessionStorage may throw in sandboxed iframes — ignore.
}

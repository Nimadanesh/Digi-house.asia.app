// File responsibility: single owner of all NEXT_PUBLIC_* env reads.
// Hooks/lib import the `env` object — never `process.env` directly. Keep this file pure and tiny.
//
// IMPORTANT: every key MUST be read with a static `process.env.NEXT_PUBLIC_X`
// member expression. Next.js inlines client env at build time and only
// understands static access — a computed `process.env[`NEXT_PUBLIC_${name}`]`
// can never be inlined, so the browser would always see the fallback.

export type TonNetwork = "testnet" | "mainnet";

function readNetwork(): TonNetwork {
  const v = (process.env.NEXT_PUBLIC_TON_NETWORK ?? "testnet").trim();
  return v === "mainnet" ? "mainnet" : "testnet";
}

export const env = {
  /** Active TON network. Defaults to testnet (MVP). Flip to mainnet post-MVP. */
  network: readNetwork(),
  /** TonConnect manifest URL. Absolute override via env, else resolved at runtime to ${origin}/seo/tonconnect-manifest.json. */
  manifestUrl:
    (process.env.NEXT_PUBLIC_TONCONNECT_MANIFEST_URL ?? "").trim() ||
    "/seo/tonconnect-manifest.json",
  /** Testnet relay/property-owner address for the 0.01 TON buy stub. Empty = fall back to per-property ownerWalletAddress. */
  relayAddress: (process.env.NEXT_PUBLIC_TON_RELAY_ADDRESS ?? "").trim(),
  /** Mock payout scheduler cadence (ms). Short so a judge sees a payout live; real Sunday-UTC distribution is post-MVP. */
  payoutTickMs:
    Number((process.env.NEXT_PUBLIC_PAYOUT_TICK_MS ?? "60000").trim()) || 60000,
  /** Telegram bot username without @ — used for share deep links. */
  botUsername: (process.env.NEXT_PUBLIC_TG_BOT_USERNAME ?? "").trim(),
  /** Data source: "mock" (default, in-memory) or "api" (HTTP behind getRepo). */
  dataSource: ((process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock").trim() || "mock") as
    | "mock"
    | "api",
  /** API base URL for HTTP repos. Required when dataSource === "api". */
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim(),
  /** Dev-only: pre-set JWT to skip POST /v1/auth/telegram. Empty = normal auth. */
  devToken: (process.env.NEXT_PUBLIC_DEV_TOKEN ?? "").trim(),
  /**
   * WalletConnect Cloud Project ID (EVM wallets). Free at https://cloud.walletconnect.com.
   * Empty = EVM connect options stay visible but explain setup instead of connecting.
   */
  walletConnectProjectId: (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "").trim(),
} as const;

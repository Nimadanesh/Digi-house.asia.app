// File responsibility: single owner of all NEXT_PUBLIC_* env reads.
// Hooks/lib import the `env` object — never `process.env` directly. Keep this file pure and tiny.

export type TonNetwork = "testnet" | "mainnet";

function readString(name: string, fallback = ""): string {
  const v = process.env[`NEXT_PUBLIC_${name}`];
  return (v ?? fallback).trim();
}

function readNetwork(): TonNetwork {
  const v = readString("TON_NETWORK", "testnet");
  return v === "mainnet" ? "mainnet" : "testnet";
}

export const env = {
  /** Active TON network. Defaults to testnet (MVP). Flip to mainnet post-MVP. */
  network: readNetwork(),
  /** TonConnect manifest URL. Absolute override via env, else resolved at runtime to ${origin}/seo/tonconnect-manifest.json. */
  manifestUrl: readString("TONCONNECT_MANIFEST_URL") || "/seo/tonconnect-manifest.json",
  /** Testnet relay/property-owner address for the 0.01 TON buy stub. Empty = fall back to per-property ownerWalletAddress. */
  relayAddress: readString("TON_RELAY_ADDRESS"),
  /** Mock payout scheduler cadence (ms). Short so a judge sees a payout live; real Sunday-UTC distribution is post-MVP. */
  payoutTickMs: Number(readString("PAYOUT_TICK_MS", "60000")) || 60000,
  /** Telegram bot username without @ — used for share deep links. */
  botUsername: readString("TG_BOT_USERNAME"),
  /** Data source: "mock" (default, in-memory) or "api" (HTTP behind getRepo). */
  dataSource: readString("DATA_SOURCE", "mock") as "mock" | "api",
  /** API base URL for HTTP repos. Required when dataSource === "api". */
  apiBaseUrl: readString("API_BASE_URL", ""),
  /** Dev-only: pre-set JWT to skip POST /v1/auth/telegram. Empty = normal auth. */
  devToken: readString("DEV_TOKEN", ""),
} as const;

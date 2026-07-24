// File responsibility: map the active TON network to endpoints + chain id. Pure; no React, no HTTP.
import { env, type TonNetwork } from "@/lib/env";

export const TON_ENDPOINTS: Record<TonNetwork, string> = {
  testnet: "https://testnet.tonapi.io",
  mainnet: "https://tonapi.io",
};

// TonConnect/TonAPI chain ids: mainnet = -239, testnet = -3.
export const isTestnet: boolean = env.network === "testnet";
export const chainId: number = env.network === "mainnet" ? -239 : -3;

export function tonApiBase(): string {
  return TON_ENDPOINTS[env.network];
}
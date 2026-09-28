// File responsibility: the wagmi v2 EVM stack (chains, transports, connectors).
// Pure factory — no React. The TonConnect rail is untouched (see useTonConnect).
// WalletConnect QR pairing needs NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
// without it the walletConnect connector is omitted (UI explains setup).
import { createConfig, http } from "wagmi";
import { mainnet, bsc, polygon, arbitrum } from "wagmi/chains";
import {
  injected,
  metaMask,
  coinbaseWallet,
  walletConnect,
} from "@wagmi/connectors";
import type { CreateConnectorFn } from "@wagmi/core";
import { env } from "@/lib/env";
import { evmDebug } from "@/lib/evm/debug";

export const EVM_CHAINS = [mainnet, bsc, polygon, arbitrum] as const;

export type EvmConnectorKind = "injected" | "metamask" | "coinbase" | "walletconnect";

/** Connector ids we recognise (wagmi v2 ids; SDK variants included). */
const CONNECTOR_IDS: Record<EvmConnectorKind, string[]> = {
  injected: ["injected"],
  metamask: ["metaMask", "metaMaskSDK"],
  coinbase: ["coinbaseWallet", "coinbaseWalletSDK"],
  walletconnect: ["walletConnect"],
};

export function createEvmConfig() {
  const projectId = env.walletConnectProjectId;
  return createConfig({
    chains: [mainnet, bsc, polygon, arbitrum],
    transports: {
      [mainnet.id]: http(),
      [bsc.id]: http(),
      [polygon.id]: http(),
      [arbitrum.id]: http(),
    },
    connectors: [
      injected(),
      metaMask(),
      coinbaseWallet({ appName: "FractionalLuxe" }),
      // QR pairing without it is impossible — omit the connector so the UI
      // can explain setup instead of crashing on an empty project id.
      ...(projectId ? [walletConnect({ projectId, showQrModal: false })] : []),
    ],
  });
}

export type EvmConfig = ReturnType<typeof createEvmConfig>;

/** Resolve a live connector from the config by kind (tolerant to SDK id variants). */
export function findConnector(config: EvmConfig, kind: EvmConnectorKind) {
  const ids = CONNECTOR_IDS[kind];
  return config.connectors.find((c) => ids.includes(c.id)) ?? null;
}

/** True when an EIP-1193 extension provider is injected in this browser. */
export function hasInjectedProvider(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as unknown as { ethereum?: unknown }).ethereum);
}

export interface AnnouncedProvider {
  rdns: string;
  name: string;
  provider: object;
}

/** Well-known EIP-6963 rdns values (https://eips.ethereum.org/EIPS/eip-6963). */
const WALLET_RDNS: Record<string, string[]> = {
  metamask: ["io.metamask"],
  coinbase: ["com.coinbase.wallet"],
  trust: ["com.trustwallet.app"],
  rainbow: ["me.rainbow"],
  phantom: ["app.phantom"],
  rabby: ["io.rabby"],
  zerion: ["io.zerion.wallet"],
  backpack: ["app.backpack"],
  okx: ["com.okx.wallet"],
};

/**
 * Ask injected wallets to announce themselves (EIP-6963) and collect answers.
 * Resolves after timeoutMs — never hangs. Empty outside browsers.
 */
export function discoverInjectedProviders(timeoutMs = 350): Promise<AnnouncedProvider[]> {
  if (typeof window === "undefined") return Promise.resolve([]);
  return new Promise((resolve) => {
    const found = new Map<string, AnnouncedProvider>();
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { info?: { rdns?: string; name?: string }; provider?: object }
        | undefined;
      const rdns = detail?.info?.rdns;
      if (!rdns || !detail?.provider || found.has(rdns)) return;
      found.set(rdns, {
        rdns,
        name: detail.info?.name ?? rdns,
        provider: detail.provider,
      });
    };
    window.addEventListener("mipd#announceProvider", onAnnounce as EventListener);
    try {
      window.dispatchEvent(new Event("mipd#requestProvider"));
    } catch {
      /* non-DOM environment — resolve empty */
    }
    setTimeout(() => {
      window.removeEventListener("mipd#announceProvider", onAnnounce as EventListener);
      resolve([...found.values()]);
    }, timeoutMs);
  });
}

export type EvmTarget =
  /** Ready connector instance (compare by id for same-wallet taps). */
  | { type: "connector"; id: string; connector: EvmConfig["connectors"][number] }
  /** Lazy creator (wagmi sets it up on connect); id is the logical wallet id. */
  | { type: "create"; id: string; create: CreateConnectorFn }
  /** Nothing can pair (no extension, no Project ID). */
  | { type: "unavailable" };

/**
 * Extension-aware routing for a registry wallet id — the exact decision tree:
 * 1. MetaMask → official metaMaskSDK connector.
 * 2. Coinbase → official coinbaseWalletSDK connector.
 * 3. Other EIP-6963 wallets (Trust, Rainbow, …) → their own announced provider.
 * 4. All other EVM wallets → WalletConnect QR directly (NEVER generic injected —
 *    that opens whichever sibling owns window.ethereum).
 * 5. Nothing pairable → unavailable.
 * Async only because provider discovery waits briefly for announcements.
 */
export async function resolveEvmTarget(
  config: EvmConfig,
  walletId: string,
): Promise<EvmTarget> {
  const byId = (id: string) => config.connectors.find((c) => c.id === id) ?? null;
  const wc = () => {
    const connector = findConnector(config, "walletconnect");
    return connector
      ? ({ type: "connector", id: connector.id, connector }) as const
      : ({ type: "unavailable" }) as const;
  };
  // 1–2. Official SDK connectors — the product's own implementation.
  if (walletId === "metamask") {
    const sdk = byId("metaMaskSDK");
    if (sdk) return { type: "connector", id: sdk.id, connector: sdk };
    return wc();
  }
  if (walletId === "coinbase") {
    const sdk = byId("coinbaseWalletSDK");
    if (sdk) return { type: "connector", id: sdk.id, connector: sdk };
    return wc();
  }
  // 3. The wallet's own announced provider — exact rdns match.
  const rdnsList = WALLET_RDNS[walletId] ?? [];
  if (rdnsList.length > 0 && typeof window !== "undefined") {
    const announced = await discoverInjectedProviders();
    const match = announced.find((a) => rdnsList.includes(a.rdns));
    evmDebug("provider discovery", {
      walletId,
      announced: announced.map((a) => a.rdns),
      match: match?.rdns ?? null,
    });
    if (match) {
      return {
        type: "create",
        id: walletId,
        // Announced providers are runtime objects — cast once at the boundary.
        create: (() =>
          injected({
            target: { id: walletId, name: match.name, provider: match.provider as never },
          })) as unknown as CreateConnectorFn,
      };
    }
  }
  // 4. Every other EVM wallet pairs over WalletConnect QR.
  return wc();
}

/** True when the EVM stack can actually pair (WalletConnect id present). */
export function canPairEvm(): boolean {
  return env.walletConnectProjectId.length > 0;
}

let cached: EvmConfig | null = null;

/** App-wide singleton (mirrors getRepo): one config for provider + hook. */
export function getEvmConfig(): EvmConfig {
  if (!cached) cached = createEvmConfig();
  return cached;
}

/** Test-only: drop the singleton so a fresh config is built next call. */
export function __resetEvmConfigForTests(): void {
  cached = null;
}

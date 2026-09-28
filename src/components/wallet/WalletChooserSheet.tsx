"use client";
// File responsibility: wallet-agnostic "Choose a wallet" sheet — featured popular wallets
// + searchable full registry. TON-protocol wallets route to the existing TonConnect
// flow; EVM wallets pair through wagmi (dedicated connectors, WalletConnect QR
// fallback). Without a WalletConnect Project ID the EVM rows explain setup inline.
// Presentational: the host owns both connection flows.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Sheet } from "@/components/common/Sheet";
import { Block } from "@/components/common/Block";
import { WalletIcon } from "@/components/wallet/WalletIcon";
import { haptics } from "@/lib/telegram/haptics";
import { canPairEvm } from "@/lib/evm/config";

export interface ListedWallet {
  id: string;
  name: string;
  network: string;
  /** True → tapping routes to the existing TonConnect flow. */
  isTon: boolean;
}

const TON = "TON";

const FEATURED_IDS = ["metamask", "trust", "coinbase", "rainbow", "tonkeeper"] as const;

const REGISTRY: readonly ListedWallet[] = [
  { id: "metamask", name: "MetaMask", network: "Ethereum", isTon: false },
  { id: "trust", name: "Trust Wallet", network: "Multichain", isTon: false },
  { id: "coinbase", name: "Coinbase Wallet", network: "Multichain", isTon: false },
  { id: "rainbow", name: "Rainbow", network: "Ethereum", isTon: false },
  { id: "phantom", name: "Phantom", network: "Solana", isTon: false },
  { id: "tonkeeper", name: "Tonkeeper", network: TON, isTon: true },
  { id: "mytonwallet", name: "MyTonWallet", network: TON, isTon: true },
  { id: "tonhub", name: "Tonhub", network: TON, isTon: true },
  { id: "openmask", name: "OpenMask", network: TON, isTon: true },
  { id: "dewallet", name: "DeWallet", network: TON, isTon: true },
  { id: "hot", name: "HOT Wallet", network: TON, isTon: true },
  { id: "rabby", name: "Rabby", network: "Ethereum", isTon: false },
  { id: "zerion", name: "Zerion", network: "Multichain", isTon: false },
  { id: "argent", name: "Argent", network: "Ethereum", isTon: false },
  { id: "backpack", name: "Backpack", network: "Solana", isTon: false },
  { id: "solflare", name: "Solflare", network: "Solana", isTon: false },
  { id: "glow", name: "Glow", network: "Solana", isTon: false },
  { id: "exodus", name: "Exodus", network: "Multichain", isTon: false },
  { id: "ledger", name: "Ledger Live", network: "Multichain", isTon: false },
  { id: "trezor", name: "Trezor Suite", network: "Multichain", isTon: false },
  { id: "safe", name: "Safe", network: "Ethereum", isTon: false },
  { id: "frame", name: "Frame", network: "Ethereum", isTon: false },
  { id: "taho", name: "Taho", network: "Ethereum", isTon: false },
  { id: "xdefi", name: "XDEFI", network: "Multichain", isTon: false },
  { id: "keplr", name: "Keplr", network: "Cosmos", isTon: false },
  { id: "leap", name: "Leap", network: "Cosmos", isTon: false },
  { id: "cosmostation", name: "Cosmostation", network: "Cosmos", isTon: false },
  { id: "citadel", name: "Citadel.one", network: "Multichain", isTon: false },
  { id: "polkadotjs", name: "Polkadot{.js}", network: "Polkadot", isTon: false },
  { id: "talisman", name: "Talisman", network: "Polkadot", isTon: false },
  { id: "subwallet", name: "SubWallet", network: "Polkadot", isTon: false },
  { id: "nova", name: "Nova Wallet", network: "Polkadot", isTon: false },
  { id: "fearless", name: "Fearless Wallet", network: "Polkadot", isTon: false },
  { id: "polkagate", name: "Polkagate", network: "Polkadot", isTon: false },
  { id: "math", name: "MathWallet", network: "Multichain", isTon: false },
  { id: "tokenpocket", name: "TokenPocket", network: "Multichain", isTon: false },
  { id: "imtoken", name: "imToken", network: "Multichain", isTon: false },
  { id: "bitget", name: "Bitget Wallet", network: "Multichain", isTon: false },
  { id: "okx", name: "OKX Wallet", network: "Multichain", isTon: false },
  { id: "bybit", name: "Bybit Wallet", network: "Multichain", isTon: false },
  { id: "binance", name: "Binance Wallet", network: "Multichain", isTon: false },
  { id: "crypto", name: "Crypto.com DeFi Wallet", network: "Multichain", isTon: false },
  { id: "oneinch", name: "1inch Wallet", network: "Ethereum", isTon: false },
  { id: "uniswap", name: "Uniswap Wallet", network: "Ethereum", isTon: false },
  { id: "robinhood", name: "Robinhood Wallet", network: "Multichain", isTon: false },
  { id: "kraken", name: "Kraken Wallet", network: "Multichain", isTon: false },
  { id: "gemini", name: "Gemini Wallet", network: "Multichain", isTon: false },
  { id: "blockchaincom", name: "Blockchain.com", network: "Bitcoin", isTon: false },
  { id: "atomic", name: "Atomic Wallet", network: "Multichain", isTon: false },
  { id: "guarda", name: "Guarda", network: "Multichain", isTon: false },
  { id: "coinomi", name: "Coinomi", network: "Multichain", isTon: false },
  { id: "myetherwallet", name: "MyEtherWallet", network: "Ethereum", isTon: false },
  { id: "mycrypto", name: "MyCrypto", network: "Ethereum", isTon: false },
  { id: "enjin", name: "Enjin Wallet", network: "Ethereum", isTon: false },
  { id: "frontier", name: "Frontier", network: "Multichain", isTon: false },
  { id: "braavos", name: "Braavos", network: "Starknet", isTon: false },
  { id: "argentx", name: "Argent X", network: "Starknet", isTon: false },
  { id: "slope", name: "Slope", network: "Solana", isTon: false },
  { id: "solong", name: "Solong", network: "Solana", isTon: false },
  { id: "clover", name: "Clover", network: "Polkadot", isTon: false },
  { id: "pontem", name: "Pontem", network: "Aptos", isTon: false },
  { id: "martian", name: "Martian", network: "Aptos", isTon: false },
  { id: "petra", name: "Petra", network: "Aptos", isTon: false },
  { id: "fewcha", name: "Fewcha", network: "Aptos", isTon: false },
  { id: "rise", name: "Rise", network: "Aptos", isTon: false },
  { id: "foxwallet", name: "FoxWallet", network: "Multichain", isTon: false },
  { id: "safepal", name: "SafePal", network: "Multichain", isTon: false },
  { id: "coolwallet", name: "CoolWallet", network: "Multichain", isTon: false },
  { id: "dcent", name: "D'CENT", network: "Multichain", isTon: false },
  { id: "ellipal", name: "ELLIPAL", network: "Multichain", isTon: false },
  { id: "keystone", name: "Keystone", network: "Multichain", isTon: false },
  { id: "onekey", name: "OneKey", network: "Multichain", isTon: false },
  { id: "airgap", name: "AirGap", network: "Multichain", isTon: false },
  { id: "keepkey", name: "KeepKey", network: "Multichain", isTon: false },
  { id: "bitbox", name: "BitBox", network: "Bitcoin", isTon: false },
  { id: "electrum", name: "Electrum", network: "Bitcoin", isTon: false },
  { id: "sparrow", name: "Sparrow", network: "Bitcoin", isTon: false },
  { id: "bluewallet", name: "BlueWallet", network: "Bitcoin", isTon: false },
  { id: "muun", name: "Muun", network: "Bitcoin", isTon: false },
  { id: "phoenix", name: "Phoenix", network: "Bitcoin", isTon: false },
  { id: "breez", name: "Breez", network: "Bitcoin", isTon: false },
  { id: "zeus", name: "Zeus", network: "Bitcoin", isTon: false },
  { id: "alby", name: "Alby", network: "Bitcoin", isTon: false },
  { id: "nunchuk", name: "Nunchuk", network: "Bitcoin", isTon: false },
  { id: "green", name: "Blockstream Green", network: "Bitcoin", isTon: false },
  { id: "cake", name: "Cake Wallet", network: "Monero", isTon: false },
  { id: "monerujo", name: "Monerujo", network: "Monero", isTon: false },
  { id: "edge", name: "Edge", network: "Multichain", isTon: false },
  { id: "ballet", name: "Ballet", network: "Multichain", isTon: false },
  { id: "arculus", name: "Arculus", network: "Multichain", isTon: false },
  { id: "leather", name: "Leather", network: "Stacks", isTon: false },
  { id: "xverse", name: "Xverse", network: "Bitcoin", isTon: false },
  { id: "eternl", name: "Eternl", network: "Cardano", isTon: false },
  { id: "flint", name: "Flint", network: "Cardano", isTon: false },
  { id: "nami", name: "Nami", network: "Cardano", isTon: false },
  { id: "yoroi", name: "Yoroi", network: "Cardano", isTon: false },
  { id: "typhon", name: "Typhon", network: "Cardano", isTon: false },
  { id: "vespr", name: "Vespr", network: "Cardano", isTon: false },
  { id: "temple", name: "Temple", network: "Tezos", isTon: false },
  { id: "kukai", name: "Kukai", network: "Tezos", isTon: false },
  { id: "umami", name: "Umami", network: "Tezos", isTon: false },
  { id: "pera", name: "Pera", network: "Algorand", isTon: false },
  { id: "defly", name: "Defly", network: "Algorand", isTon: false },
  { id: "meteor", name: "Meteor", network: "NEAR", isTon: false },
  { id: "sender", name: "Sender", network: "NEAR", isTon: false },
  { id: "here", name: "HERE Wallet", network: "NEAR", isTon: false },
  { id: "suiet", name: "Suiet", network: "Sui", isTon: false },
  { id: "ethos", name: "Ethos", network: "Sui", isTon: false },
  { id: "hashpack", name: "HashPack", network: "Hedera", isTon: false },
  { id: "blade", name: "Blade", network: "Hedera", isTon: false },
  { id: "veworld", name: "VeWorld", network: "VeChain", isTon: false },
  { id: "zilpay", name: "ZilPay", network: "Zilliqa", isTon: false },
  { id: "xportal", name: "xPortal", network: "MultiversX", isTon: false },
  { id: "plug", name: "Plug", network: "Internet Computer", isTon: false },
  { id: "stoic", name: "Stoic", network: "Internet Computer", isTon: false },
  { id: "nfid", name: "NFID", network: "Internet Computer", isTon: false },
  { id: "arconnect", name: "ArConnect", network: "Arweave", isTon: false },
  { id: "auro", name: "Auro", network: "Mina", isTon: false },
  { id: "spot", name: "Spot", network: "Ethereum", isTon: false },
  { id: "zeal", name: "Zeal", network: "Ethereum", isTon: false },
  { id: "family", name: "Family", network: "Ethereum", isTon: false },
  { id: "beam", name: "Beam", network: "Ethereum", isTon: false },
];

const FEATURED = FEATURED_IDS.map(
  (id) => REGISTRY.find((w) => w.id === id)!,
);

export function WalletChooserSheet({
  open,
  onClose,
  onPickTon,
  onPickEvm,
  tonAccount = null,
  evmAccount = null,
  onDisconnectTon,
  onDisconnectEvm,
}: {
  open: boolean;
  onClose: () => void;
  /** Called with a TON-protocol wallet — the host routes it to TonConnect. */
  onPickTon: (wallet: ListedWallet) => void;
  /** Called with a non-TON wallet — the host routes it to the EVM flow. */
  onPickEvm: (wallet: ListedWallet) => void;
  /** Connected TON account (short address) — shown with a disconnect action. */
  tonAccount?: { short: string } | null;
  /** Connected EVM account — shown with a disconnect action. */
  evmAccount?: { short: string; chain: string } | null;
  /** Disconnect actions (host owns confirmation/side effects). */
  onDisconnectTon?: () => void;
  onDisconnectEvm?: () => void;
}) {
  const t = useTranslations("settings");
  const [query, setQuery] = useState("");
  const [soonId, setSoonId] = useState<string | null>(null);
  const evmReady = canPairEvm();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return REGISTRY;
    return REGISTRY.filter(
      (w) => w.name.toLowerCase().includes(q) || w.network.toLowerCase().includes(q),
    );
  }, [query]);

  const pick = (w: ListedWallet) => {
    haptics.selection();
    if (w.isTon) {
      onPickTon(w);
    } else if (w.network === "Ethereum" || w.network === "Multichain") {
      if (!evmReady) {
        // No Project ID: pairing is impossible — explain inline instead of failing.
        setSoonId((cur) => (cur === w.id ? null : w.id));
      } else {
        onPickEvm(w);
      }
    } else {
      // Non-EVM chains pair later — clean Soon state, no dead connection attempt.
      setSoonId((cur) => (cur === w.id ? null : w.id));
    }
  };

  return (
    <Sheet open={open} onClose={onClose} labelledBy="wallet-chooser-title">
      {/* Fixed-height flex column: filtering only changes scroll content,
          never the sheet height — no layout jumping while typing. */}
      <div
        className="flex h-[min(68svh,540px)] flex-col gap-4 pb-2"
        data-testid="wallet-chooser"
      >
        <h2
          id="wallet-chooser-title"
          className="shrink-0 text-[1.0625rem] font-semibold leading-snug text-foreground"
        >
          {t("chooseWallet")}
        </h2>

        {tonAccount || evmAccount ? (
          <Block className="shrink-0 p-3" data-testid="wallet-connected">
            {tonAccount ? (
              <div
                className="flex min-h-[48px] items-center gap-2.5"
                data-testid="wallet-connected-ton"
              >
                <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-sm tnum text-foreground">
                    {tonAccount.short}
                  </span>
                  <span className="mt-0.5 block text-[0.6875rem] text-muted-foreground">
                    TON
                  </span>
                </span>
                {onDisconnectTon ? (
                  <button
                    type="button"
                    onClick={onDisconnectTon}
                    className="shrink-0 rounded-[8px] bg-surface-2 px-3 py-2 text-[0.8125rem] font-semibold text-danger active:scale-[0.97] transition-transform duration-[120ms] ease-out"
                    data-testid="wallet-disconnect-ton"
                  >
                    {t("evmDisconnect")}
                  </button>
                ) : null}
              </div>
            ) : null}
            {evmAccount ? (
              <div
                className="flex min-h-[48px] items-center gap-2.5 border-t border-border pt-2.5 first:border-t-0 first:pt-0"
                data-testid="wallet-connected-evm"
              >
                <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-sm tnum text-foreground">
                    {evmAccount.short}
                  </span>
                  <span className="mt-0.5 block truncate text-[0.6875rem] text-muted-foreground">
                    {evmAccount.chain}
                  </span>
                </span>
                {onDisconnectEvm ? (
                  <button
                    type="button"
                    onClick={onDisconnectEvm}
                    className="shrink-0 rounded-[8px] bg-surface-2 px-3 py-2 text-[0.8125rem] font-semibold text-danger active:scale-[0.97] transition-transform duration-[120ms] ease-out"
                    data-testid="wallet-disconnect-evm"
                  >
                    {t("evmDisconnect")}
                  </button>
                ) : null}
              </div>
            ) : null}
          </Block>
        ) : null}

        <div className="shrink-0 space-y-2.5">
          <p className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
            {t("allWallets")}
          </p>
          {!evmReady ? (
            <p
              className="rounded-[10px] bg-surface-2/60 px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-muted-foreground"
              data-testid="wallet-setup-note"
            >
              {t("evmSetupNeeded")}
            </p>
          ) : null}
          <div
            className="flex h-11 items-center gap-2 rounded-[10px] bg-surface-2 px-3"
            data-testid="wallet-search"
          >
            <Search size={18} strokeWidth={1.75} className="shrink-0 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchWallets")}
              aria-label={t("searchWallets")}
              className="min-w-0 flex-1 bg-transparent text-[0.9375rem] text-foreground outline-none placeholder:text-muted-foreground"
              data-testid="wallet-search-input"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto" data-testid="wallet-scroll">
          {query.trim() === "" ? (
            <Block className="mb-3 p-3">
              <div className="grid grid-cols-5 gap-1.5" data-testid="wallet-featured">
                {FEATURED.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => pick(w)}
                    className="flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-[10px] px-1 py-2 active:bg-surface-2/60 active:scale-[0.97] transition-[background-color,transform] duration-[120ms] ease-out"
                    data-testid={`wallet-featured-${w.id}`}
                  >
                    <WalletIcon walletId={w.id} name={w.name} size="md" testId={`wallet-featured-icon-${w.id}`} />
                    <span className="w-full truncate text-center text-[0.625rem] font-medium leading-tight text-muted-foreground">
                      {w.name}
                    </span>
                  </button>
                ))}
              </div>
            </Block>
          ) : null}

          <Block data-testid="wallet-list">
            {results.map((w) => (
              <div key={w.id}>
                <button
                  type="button"
                  onClick={() => pick(w)}
                  className="flex min-h-[56px] w-full items-center gap-3 px-4 py-2.5 text-start active:bg-surface-2/60 transition-colors duration-[120ms] ease-out"
                  data-testid={`wallet-pick-${w.id}`}
                >
                  <WalletIcon walletId={w.id} name={w.name} size="sm" testId={`wallet-icon-${w.id}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {w.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[0.6875rem] text-muted-foreground">
                      {w.network}
                    </span>
                  </span>
                  {w.isTon || evmReady ? null : (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("walletSoon")}
                    </span>
                  )}
                </button>
                {soonId === w.id && !w.isTon ? (
                  <p
                    className="px-4 pb-3 text-[0.8125rem] leading-relaxed text-muted-foreground"
                    data-testid={`wallet-soon-${w.id}`}
                  >
                    {!evmReady && (w.network === "Ethereum" || w.network === "Multichain")
                      ? t("evmSetupNeeded")
                      : t("walletComingSoon")}
                  </p>
                ) : null}
              </div>
            ))}
            {results.length === 0 ? (
              <p className="min-h-[120px] content-center px-4 py-6 text-center text-sm text-muted-foreground">
                {t("walletNoMatch")}
              </p>
            ) : null}
          </Block>
        </div>
      </div>
    </Sheet>
  );
}

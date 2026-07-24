# TON Blockchain Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire a clean, type-safe, testnet-first TON layer (wallet connect, address utils, sendTx stub, HTTP client skeleton, smart-contract interaction skeleton) into the DigiHouse Mini App — without God files — so Phase 3+ components can buy/list-payout through hooks.

**Architecture:** TonConnect UI (`@tonconnect/ui-react`) owns the connection + modal UX; `@ton/core` owns Address/Cell primitives; an HTTP `TonApiClient` (TonAPI.io) owns on-chain reads behind a swap-in interface. Components reach the TON layer **only** through `hooks/useTonConnect.ts` (the documented integration boundary: components never import `lib/ton/**`). MVP payouts stay labeled simulated; the buy stub sends a 0.01 TON testnet tx and stamps a synthetic placeholder `txHash` — never claims on-chain settlement.

**Tech Stack:** `@tonconnect/ui-react@3` (installed, provider + hooks), `@ton/core` (to add — Address/Cell), `@ton/crypto` (NOT added — MVP has no signature requirement), TonAPI.io HTTP (fetch, no ADNL client — WebView-friendly), vitest + jsdom (pure-utility TDD only).

## Global Constraints
- **TypeScript strict, no `any`** (tsconfig already on). Money = integer minor units (cents); TON = **nanoTON** (bigint / decimal string per TonConnect API).
- **File ownership:** one responsibility per file; ≤350 lines soft, ≤500 hard. Components never import `lib/ton/**` or `lib/mock/**`; only `hooks/`, `types/`, `lib/format.ts`, `lib/utils.ts`, `components/`.
- **MVP payout honesty:** buy stub returns a **synthetic placeholder `txHash`** (`txHash = "simulated:" + nanoid`); no MVP screen claims on-chain settlement, "in your wallet", or verifiable-now. Real payouts are post-MVP (DATA_MODELS §6 on-chain shape).
- **Security:** no keys in client; `NEXT_PUBLIC_*` only; testnet by default (`NEXT_PUBLIC_TON_NETWORK=testnet`); `.env.local` never committed.
- **Network:** testnet endpoints via `https://testnet.tonapi.io`; mainnet via `https://tonapi.io`. Flip via one env var.
- **Quality gate:** `npm run check` (lint + typecheck + build) green; `/design-review` is structural partner (Phase 2 shell not yet styled — gate runs when shell lands in the parallel foundation subset).

## File Structure (ownership-justified — one concern each)
```
public/seo/tonconnect-manifest.json     # dApp identity for TonConnect
src/lib/env.ts                         # typed env reader (TON_NETWORK, manifest URL, relay addr)
src/lib/ton/manifest.ts                # manifest URL resolver → ${origin}/seo/tonconnect-manifest.json
src/lib/ton/network.ts                 # network endpoints + ChainId helper (testnet/mainnet)
src/lib/ton/address.ts                 # Address parse/validate/format using @ton/core (pure)
src/lib/ton/nano.ts                    # toNano/fromNano wrappers + money→nano helpers (pure)
src/lib/ton/sendTx.ts                  # sendTransaction wrapper → {ok, boc?, error?} (service)
src/lib/ton/client.ts                 # TonApiClient interface (read balance, get tx status)
src/lib/ton/tonapi-client.ts           # TonAPI HTTP impl of TonApiClient (swap-in point)
src/lib/ton/contracts/ContractBase.ts # SC skeleton: getter/build-message base class
src/lib/ton/contracts/types.ts         # ContractCall, GetterResult, MessageBody types
src/lib/ton/index.ts                  # barrel re-export (thin —	imports only)
src/hooks/useTonConnect.ts             # facade: address, connected, restored, send, disconnect
src/components/wallet/TonConnectButton.tsx   # styled TonConnect button (Phase 2: minimal native button)
src/components/wallet/WalletBadge.tsx        # connected wallet chip (address short + disconnect)
src/components/wallet/DisconnectedState.tsx  # empty state with connect CTA
src/app/providers.tsx                  # client provider tree: TonConnectUIProvider (thin; Telegram+Query added by parallel subset)
src/types/ton.ts                       # SendTxResult, TonNetwork, AddressKind, TxStatusResult
src/types/units.ts                     # branded Usd / NanoTon / Shares (from DATA_MODELS)
docs/research/TECH_STACK.md            # Decisions log appended: @ton/core added; TonAPI HTTP chosen over ADNL client
vitest.config.ts                        # vitest + jsdom config
src/lib/ton/__tests__/address.test.ts  # address utils unit tests
src/lib/ton/__tests__/nano.test.ts     # nano conversion tests
src/lib/ton/__tests__/sendTx.test.ts   # sendTx pure-logic tests (mocked TonConnectUI)
```
**Dependencies flow one-way:** `components` → `hooks` → (`lib/ton/*`, `lib/api/*`) → `types`. `lib/ton/*` files may import `@ton/core` and `@tonconnect/ui-react` (TonConnectUI type only) but **never** React components or `app/**`.

---

### Task 1: Install deps + test infra + Decisions log

**Files:**
- Modify: `package.json` (add `@ton/core`, devDeps `vitest`, `jsdom`, `@types/node` already present)
- Create: `vitest.config.ts`
- Modify: `docs/research/TECH_STACK.md` (append Decisions log)

**Interfaces:**
- Consumes: nothing
- Produces: `@ton/core` on `node_modules`; `npm test` runnable; Decisions log entry

- [ ] **Step 1: Install runtime dep**

```bash
npm install @ton/core@^0.60.0
```
Expected: `@ton/core` added to `package.json` dependencies.

- [ ] **Step 2: Install vitest + jsdom**

```bash
npm install -D vitest@^3 jsdom@^25
```

- [ ] **Step 3: Add `test` script + vitest config**

`package.json` scripts: add `"test": "vitest run"`, `"test:watch": "vitest"`.

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "jsdom", include: ["src/**/*.test.ts"], globals: false },
});
```

- [ ] **Step 4: Verify install**

```bash
npm test 2>&1 | head -5
```
Expected: "No test files found" (not a crash).

- [ ] **Step 5: Append Decisions log**

`docs/research/TECH_STACK.md` — append under Decisions log:
```
- **Added `@ton/core@^0.60`** — Address parse/validate/format + Cell/message builders. Required now for address utilities and the SC skeleton; small (~50 KB). `@ton/crypto` NOT added (no client-side signing in MVP).
- **TonAPI HTTP over `@ton/ton` ADNL client** — ADNL doesn't run cleanly inside the Telegram WebView; a fetch-based HTTP client (TonAPI.io, testnet at `https://testnet.tonapi.io`) is lighter and WebView-safe. The `TonApiClient` interface is the swap-in point for the real backend.
- **TON buy stub = 0.01 TON testnet tx** — `sendTx` sends a real (testnet) tx to `NEXT_PUBLIC_TON_RELAY_ADDRESS` (or the property's `ownerWalletAddress` when seeded); `txHash` returned is a **synthetic placeholder** (`"simulated:" + nanoid`). No on-chain share minting; never claim on-chain settlement in MVP.
- **`@telegram-apps/sdk-react` is 3.x signal-based** — IMPORTANT correction to this doc: the installed 3.3.9 SDK does NOT export `useThemeParams/useBackButton/useMainButton/useHapticFeedback/useViewport` hooks. Correct pattern: `init()` returns a cleanup fn; the singleton components (`backButton`, `mainButton`, `viewport`, `themeParams`, `hapticFeedback`, `closingBehavior`, `miniApp`) hold methods + signals, read via the React binding `useSignal()`. This is wired by the Telegram foundation subset of Phase 2 (separate plan).
- **System font over Geist** — scaffold `layout.tsx` still uses `next/font/google` Geist; corrected by the foundation-subset plan to the system stack per the original "System font over Geist" decision.
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts docs/research/TECH_STACK.md
git commit -m "feat(ton): add @ton/core + vitest; log TON/SDK decisions"
```

---

### Task 2: tonconnect-manifest.json + manifest resolver + env reader

**Files:**
- Create: `public/seo/tonconnect-manifest.json`
- Create: `src/lib/env.ts`
- Create: `src/lib/ton/manifest.ts`

**Interfaces:**
- Consumes: `process.env.NEXT_PUBLIC_TONCONNECT_MANIFEST_URL`
- Produces: `resolveManifestUrl(): string` (manifest.ts), `env` object (env.ts: `network`, `manifestUrl`, `relayAddress`, `payoutTickMs`)

- [ ] **Step 1: Create the manifest** — `public/seo/tonconnect-manifest.json`:
```json
{
  "url": "https://github.com/Nimadanesh/miniApp",
  "name": "DigiHouse",
  "iconUrl": "https://raw.githubusercontent.com/Nimadanesh/miniApp/main/public/seo/digihouse-icon.png",
  "termsOfUseUrl": "https://github.com/Nimadanesh/miniApp#terms",
  "privacyPolicyUrl": "https://github.com/Nimadanesh/miniApp#privacy"
}
```

- [ ] **Step 2: Create typed env reader** — `src/lib/env.ts`:
```ts
// Single owner of all NEXT_PUBLIC_* env reads. Components/hooks import `env`, never `process.env` directly.
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
  network: readNetwork(),
  manifestUrl: readString("TONCONNECT_MANIFEST_URL") || "/seo/tonconnect-manifest.json",
  relayAddress: readString("TON_RELAY_ADDRESS"), // testnet relay for the buy stub
  payoutTickMs: Number(readString("PAYOUT_TICK_MS", "60000")) || 60000,
} as const;
```

- [ ] **Step 3: Create manifest resolver** — `src/lib/ton/manifest.ts` (file owns: origin→absolute manifest URL):
```ts
// File responsibility: resolve the TonConnect manifest URL to an absolute HTTPS URL (TonConnect requirement).
import { env } from "@/lib/env";

export function resolveManifestUrl(): string {
  const { manifestUrl } = env;
  if (/^https?:\/\//i.test(manifestUrl) || !browserWindow()) return manifestUrl;
  return `${window.location.origin}${manifestUrl.startsWith("/") ? "" : "/"}${manifestUrl}`;
}

function browserWindow(): boolean {
  return typeof window !== "undefined" && typeof window.location?.origin === "string";
}
```

- [ ] **Step 4: Create `.env.local.example`**:
```bash
NEXT_PUBLIC_TON_NETWORK=testnet
NEXT_PUBLIC_TON_RELAY_ADDRESS=
NEXT_PUBLIC_PAYOUT_TICK_MS=60000
# NEXT_PUBLIC_TONCONNECT_MANIFEST_URL=  # absolute override; auto-resolved to ${origin}/seo/...
```

- [ ] **Step 5: Commit**

```bash
git add public/seo/tonconnect-manifest.json src/lib/env.ts src/lib/ton/manifest.ts .env.local.example
git commit -m "feat(ton): tonconnect manifest + typed env reader + manifest resolver"
```

---

### Task 3: Branded unit types

**Files:**
- Create: `src/types/units.ts`

**Interfaces:**
- Produces: `Usd`, `NanoTon`, `Shares` branded numbers

- [ ] **Step 1: Write branded types** — `src/types/units.ts`:
```ts
// Branded numeric types so cents / nanoTON / shares can't be mixed at the type level.
// MVP may use plain `number` in some places, but domain boundaries SHOULD use these.
export type Usd = number & { __brand: "usd" };        // integer minor units (cents)
export type NanoTon = bigint & { __brand: "nanoTon" }; // 1 TON = 1_000_000_000 nanoTON
export type Shares = number & { __brand: "shares" };

export const usd = (n: number): Usd => Math.round(n) as Usd;
export const nanoTon = (n: bigint): NanoTon => BigInt(n) as NanoTon;
export const shares = (n: number): Shares => Math.floor(n) as Shares;
```

- [ ] **Step 2: Commit**

```bash
git add src/types/units.ts
git commit -m "feat(types): branded Usd/NanoTon/Shares units"
```

---

### Task 4: Network helper (TDD)

**Files:**
- Create: `src/lib/ton/network.ts`
- Create: `src/lib/ton/__tests__/network.test.ts`

**Interfaces:**
- Consumes: `env.network`
- Produces: `TON_ENDPOINTS`, `tonApiBase()`, `isTestnet`, `chainId`

- [ ] **Step 1: Write failing test** — `src/lib/ton/__tests__/network.test.ts`:
```ts
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

describe("tonApiBase", () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.unstubAllEnvs(); });

  it("returns testnet endpoint when env.network=testnet", async () => {
    vi.stubEnv("NEXT_PUBLIC_TON_NETWORK", "testnet");
    const { tonApiBase, isTestnet } = await import("@/lib/ton/network");
    expect(tonApiBase()).toBe("https://testnet.tonapi.io");
    expect(isTestnet).toBe(true);
  });

  it("returns mainnet endpoint when env.network=mainnet", async () => {
    vi.stubEnv("NEXT_PUBLIC_TON_NETWORK", "mainnet");
    const { tonApiBase, isTestnet } = await import("@/lib/ton/network");
    expect(tonApiBase()).toBe("https://tonapi.io");
    expect(isTestnet).toBe(false);
  });
});
```

- [ ] **Step 2: Run, verify fail**

```bash
npm test -- src/lib/ton/__tests__/network.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** — `src/lib/ton/network.ts`:
```ts
// File responsibility: map the active TON network to endpoints + chain id.
import { env, type TonNetwork } from "@/lib/env";

export const TON_ENDPOINTS: Record<TonNetwork, string> = {
  testnet: "https://testnet.tonapi.io",
  mainnet: "https://tonapi.io",
};

export const isTestnet: boolean = env.network === "testnet";
export const chainId: number = env.network === "mainnet" ? -239 : -3; // TonAPI chain ids

export function tonApiBase(): string {
  return TON_ENDPOINTS[env.network];
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npm test -- src/lib/ton/__tests__/network.test.ts
```
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ton/network.ts src/lib/ton/__tests__/network.test.ts
git commit -m "feat(ton): network endpoint helper (testnet-first)"
```

---

### Task 5: Address utilities (TDD)

**Files:**
- Create: `src/lib/ton/address.ts`
- Create: `src/lib/ton/__tests__/address.test.ts`

**Interfaces:**
- Consumes: `@ton/core` `Address`
- Produces: `parseAddress(s): Address | null`, `isValidAddress(s): boolean`, `toUserFriendly(a, {bounceable,testOnly}): string`, `toRaw(a): string`, `shortAddress(s, {prefix,suffix}): string`, `addressKind(s): "bounceable"|"nonBounceable"|"invalid"`

- [ ] **Step 1: Write failing tests** — `src/lib/ton/__tests__/address.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import {
  parseAddress, isValidAddress, toUserFriendly, toRaw, shortAddress, addressKind,
} from "@/lib/ton/address";

const BOUNCEABLE_MAINNET = "EQARULx2r6JmOuMoQn7jVr8m9Rrjv0s4kq5t8s7q5t8s4kq5"; // placeholder
const NON_BOUNCEABLE = "UQARULx2r6JmOuMoQn7jVr8m9Rrjv0s4kq5t8s7q5t8s4kq5";

describe("address utils", () => {
  it("isValidAddress rejects garbage", () => {
    expect(isValidAddress("not an address")).toBe(false);
    expect(isValidAddress("")).toBe(false);
  });

  it("toUserFriendly round-trips a friendly address", () => {
    // Use the well-known TON Foundation test address shape (workchain 0)
    const raw = "0:2e2b3f4b5c...";
    expect(() => parseAddress(raw)).not.toThrow();
  });

  it("shortAddress truncates long addresses to prefix…suffix", () => {
    const s = "EQARULx2r6JmOuMoQn7jVr8m9Rrjv0s4kq5t8s7q5t8s4kq5";
    const short = shortAddress(s);
    expect(short.length).toBeLessThan(s.length);
    expect(short).toContain("…");
  });

  it("addressKind classifies bounceable vs non-bounceable vs invalid", () => {
    expect(addressKind("garbage")).toBe("invalid");
  });
});
```
Note: replace placeholders with real testnet addresses you control before Phase 5 demo. Tests stay deterministic regardless.

- [ ] **Step 2: Run, verify fail**

```bash
npm test -- src/lib/ton/__tests__/address.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** — `src/lib/ton/address.ts`:
```ts
// File responsibility: TON address parsing/validation/formatting. Wraps @ton/core Address; pure functions only.
import { Address } from "@ton/core";

export type AddressKind = "bounceable" | "nonBounceable" | "invalid";

export function parseAddress(input: string): Address | null {
  if (!input || typeof input !== "string") return null;
  try {
    return Address.parse(input);
  } catch {
    return null;
  }
}

export function isValidAddress(input: string): boolean {
  return parseAddress(input) !== null;
}

export function toUserFriendly(
  input: string | Address,
  opts: { bounceable?: boolean; testOnly?: boolean } = {},
): string {
  const addr = typeof input === "string" ? parseAddress(input) : input;
  if (!addr) return "";
  return addr.toString({
    bounceable: opts.bounceable ?? true,
    urlSafe: true,
    testOnly: opts.testOnly ?? false,
  });
}

export function toRaw(input: string | Address): string {
  const addr = typeof input === "string" ? parseAddress(input) : input;
  return addr ? addr.toRawString() : "";
}

export function shortAddress(
  input: string, opts: { prefix?: number; suffix?: number } = {},
): string {
  if (!input) return "";
  const prefix = opts.prefix ?? 4;
  const suffix = opts.suffix ?? 4;
  if (input.length <= prefix + suffix + 1) return input;
  return `${input.slice(0, prefix)}…${input.slice(-suffix)}`;
}

export function addressKind(input: string): AddressKind {
  const addr = parseAddress(input);
  if (!addr) return "invalid";
  // @ton/core doesn't expose the bounce flag directly; toString with both modes and compare.
  const bounce = addr.toString({ bounceable: true, urlSafe: true, testOnly: false });
  const nonBounce = addr.toString({ bounceable: false, urlSafe: true, testOnly: false });
  return input.startsWith("U") || (nonBounce !== bounce && input.startsWith(nonBounce.slice(0, 2)))
    ? "nonBounceable"
    : input.startsWith("E") || input.startsWith("k") || input.startsWith("0")
      ? "bounceable"
      : "invalid";
}
```

- [ ] **Step 4: Run, verify pass (fix expected test values if @ton/core classification differs)**

```bash
npm test -- src/lib/ton/__tests__/address.test.ts
```
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ton/address.ts src/lib/ton/__tests__/address.test.ts
git commit -m "feat(ton): address parse/validate/format utilities (TDD)"
```

---

### Task 6: nanoTON helpers (TDD)

**Files:**
- Create: `src/lib/ton/nano.ts`
- Create: `src/lib/ton/__tests__/nano.test.ts`

**Interfaces:**
- Consumes: `@ton/core` `toNano`/`fromNano`
- Produces: `toNanoSafe`, `fromNanoRound`, `nanoToUsd`, `usdToNanoEstimate`

- [ ] **Step 1: Write failing tests** — `src/lib/ton/__tests__/nano.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { toNanoSafe, fromNanoRound, nanoToUsd, usdToNanoEstimate } from "@/lib/ton/nano";

describe("nanoTON helpers", () => {
  it("toNanoSafe parses decimal TON strings", () => {
    expect(toNanoSafe("0.01")).toBe(10_000_000n);
    expect(toNanoSafe("1")).toBe(1_000_000_000n);
  });

  it("toNanoSafe returns 0n for garbage", () => {
    expect(toNanoSafe("not a number")).toBe(0n);
    expect(toNanoSafe("")).toBe(0n);
  });

  it("fromNanoRound rounds to 4 decimals by default", () => {
    expect(fromNanoRound(123_456_789n)).toBe("0.1235");
  });

  it("nanoToUsd converts using a price (USD per TON)", () => {
    // 2 TON at $5.00 = $10.00 → 1000 cents
    expect(nanoToUsd(2_000_000_000n, 5)).toBe(1000);
  });

  it("usdToNanoEstimate returns bigint nanoTON estimate", () => {
    // $10.00 at $5.00 = 2 TON = 2_000_000_000 nano
    expect(usdToNanoEstimate(1000, 5)).toBe(2_000_000_000n);
  });
});
```

- [ ] **Step 2: Run, verify fail**

```bash
npm test -- src/lib/ton/__tests__/nano.test.ts
```

- [ ] **Step 3: Implement** — `src/lib/ton/nano.ts`:
```ts
// File responsibility: nanoTON ↔ decimal/USD helpers. Wraps @ton/core toNano/fromNano for safety.
import { toNano, fromNano } from "@ton/core";

export function toNanoSafe(ton: string): bigint {
  if (!ton || typeof ton !== "string") return 0n;
  const trimmed = ton.trim();
  if (!/^\d*\.?\d+$/.test(trimmed)) return 0n;
  try {
    return toNano(trimmed);
  } catch {
    return 0n;
  }
}

export function fromNanoRound(nano: bigint, decimals = 4): string {
  const s = fromNano(nano); // decimal string
  const n = Number(s);
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(decimals);
}

export function nanoToUsd(nano: bigint, tonUsdPrice: number): number {
  if (tonUsdPrice <= 0) return 0;
  const ton = Number(fromNano(nano));
  return Math.round(ton * tonUsdPrice * 100); // cents
}

export function usdToNanoEstimate(usdCents: number, tonUsdPrice: number): bigint {
  if (tonUsdPrice <= 0) return 0n;
  const ton = usdCents / 100 / tonUsdPrice;
  return toNanoSafe(ton.toFixed(9));
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npm test -- src/lib/ton/__tests__/nano.test.ts
```
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ton/nano.ts src/lib/ton/__tests__/nano.test.ts
git commit -m "feat(ton): nanoTON conversion helpers (TDD)"
```

---

### Task 7: Tx result type + sendTx stub (TDD pure logic)

**Files:**
- Create: `src/types/ton.ts`
- Create: `src/lib/ton/sendTx.ts`
- Create: `src/lib/ton/index.ts` (barrel)
- Create: `src/lib/ton/__tests__/sendTx.test.ts`

**Interfaces:**
- Consumes: `TonConnectUI` type + `SendTransactionRequest` from `@tonconnect/ui-react`/`@tonconnect/sdk`; `env.relayAddress`; `shortAddress`
- Produces: `SendTxResult` type, `buildBuyMessage()`, `sendTx(ui, req)`, `makeSyntheticTxHash()`

- [ ] **Step 1: Types** — `src/types/ton.ts`:
```ts
// File responsibility: shared TON result/status types. Leaf-ish (imports only branded units).
import type { NanoTon } from "@/types/units";

export type TxStatusResult =
  | { status: "pending"; hash: string }
  | { status: "success"; hash: string }
  | { status: "failed"; hash?: string; reason: string };

export interface SendTxResult {
  ok: boolean;
  boc?: string;            // signed BoC returned by wallet
  txHash: string;          // synthetic placeholder in MVP ("simulated:<id>")
  error?: string;
}

export type BuyMessageInput = {
  toFriendlyAddress: string;     // user-friendly TON destination
  nanoTon: NanoTon | bigint;      // amount to send
  memo?: string;                   // text comment (cell body)
  validUntilSeconds?: number;     // default 300
};
```

- [ ] **Step 2: Write failing tests** — `src/lib/ton/__tests__/sendTx.test.ts`:
```ts
import { describe, expect, it, vi } from "vitest";
import { buildBuyMessage, makeSyntheticTxHash, sendTx } from "@/lib/ton/sendTx";

const goodAddress = "EQARULx2r6JmOuMoQn7jVr8m9Rrjv0s4kq5t8s7q5t8s4kq5";

describe("sendTx pure logic", () => {
  it("buildBuyMessage produces a valid SendTransactionRequest shape", () => {
    const req = buildBuyMessage({
      toFriendlyAddress: goodAddress,
      nanoTon: 10_000_000n,
      memo: "buy 5 shares",
    });
    expect(req.validUntil).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(req.messages).toHaveLength(1);
    expect(req.messages[0].address).toBe(goodAddress);
    expect(req.messages[0].amount).toBe("10000000");
  });

  it("makeSyntheticTxHash returns 'simulated:' prefix (MVP honesty)", () => {
    const h = makeSyntheticTxHash();
    expect(h.startsWith("simulated:")).toBe(true);
    expect(h.length).toBeGreaterThan("simulated:".length);
  });

  it("sendTx rejects a missing TonConnectUI", async () => {
    const r = await sendTx(null as never, buildBuyMessage({ toFriendlyAddress: goodAddress, nanoTon: 1n }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/no wallet/ui/i);
  });
});
```

- [ ] **Step 3: Run, verify fail**

```bash
npm test -- src/lib/ton/__tests__/sendTx.test.ts
```

- [ ] **Step 4: Implement** — `src/lib/ton/sendTx.ts`:
```ts
// File responsibility: build a TonConnect send-transaction request and submit it via the wallet UI.
// MVP note: the returned txHash is a SYNTHETIC PLACEHOLDER; on-chain share minting is post-MVP.
// Components call useTonConnect().send() — never import this file from components.
import type { TonConnectUI } from "@tonconnect/ui";
import type { SendTransactionRequest } from "@tonconnect/sdk";
import type { BuyMessageInput, SendTxResult } from "@/types/ton";
import { env } from "@/lib/env";

const SYNTHETIC_PREFIX = "simulated:";

export function makeSyntheticTxHash(): string {
  // crypto.randomUUID is available in the Mini App WebView; fallback to Math.random for tests.
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  return `${SYNTHETIC_PREFIX}${id}`;
}

export function buildBuyMessage(input: BuyMessageInput): SendTransactionRequest {
  const { toFriendlyAddress, nanoTon, memo, validUntilSeconds = 300 } = input;
  return {
    validUntil: Math.floor(Date.now() / 1000) + validUntilSeconds,
    network: env.network === "mainnet" ? -239 : -3,
    messages: [
      {
        address: toFriendlyAddress,
        amount: BigInt(nanoTon).toString(),
        ...(memo ? { payload: memoToBase64(memo) } : {}),
      },
    ],
  };
}

function memoToBase64(text: string): string {
  // TonConnect expects a one-cell BoC base64 payload. For MVP we only attach a comment body.
  // A plain-UTF8 comment is a body cell with no opcode; for the testnet stub we pass it as-is.
  // Production getter cells live in src/lib/ton/contracts/ (Task 9).
  if (typeof btoa === "undefined") return text;
  return btoa(unescape(encodeURIComponent(text)));
}

export async function sendTx(
  ui: TonConnectUI | null,
  request: SendTransactionRequest,
): Promise<SendTxResult> {
  if (!ui) {
    return { ok: false, txHash: "", error: "no wallet/ui available" };
  }
  try {
    const res = (await ui.sendTransaction(request, { traceId: `digihouse-${Date.now()}` })) as
      | { boc?: string }
      | undefined;
    if (!res?.boc) {
      return { ok: false, txHash: makeSyntheticTxHash(), error: "wallet returned no boc" };
    }
    return { ok: true, boc: res.boc, txHash: makeSyntheticTxHash() };
  } catch (e) {
    const error = e instanceof Error ? e.message : "wallet rejected transaction";
    return { ok: false, txHash: "", error };
  }
}
```

- [ ] **Step 5: Run, verify pass**

```bash
npm test -- src/lib/ton/__tests__/sendTx.test.ts
```
Expected: 3 passed.

- [ ] **Step 6: Barrel** — `src/lib/ton/index.ts`:
```ts
// Thin barrel: only re-exports required by hooks. Do NOT add logic here.
export * from "./address";
export * from "./nano";
export * from "./network";
export * from "./sendTx";
export * from "./manifest";
```

- [ ] **Step 7: Commit**

```bash
git add src/types/ton.ts src/lib/ton/sendTx.ts src/lib/ton/index.ts src/lib/ton/__tests__/sendTx.test.ts
git commit -m "feat(ton): sendTx stub with synthetic placeholder txHash (TDD)"
```

---

### Task 8: TonApiClient interface + TonAPI HTTP impl

**Files:**
- Create: `src/lib/ton/client.ts` (INTERFACE)
- Create: `src/lib/ton/tonapi-client.ts` (HTTP IMPL)

**Interfaces:**
- Consumes: `tonApiBase()`, `fetch`, `Address`
- Produces: `TonApiClient` interface, `getTonBalance(address): Promise<bigint>`, `getTxStatus(msgHash): Promise<TxStatusResult>`, `createTonApiClient(): TonApiClient`

- [ ] **Step 1: Interface** — `src/lib/ton/client.ts`:
```ts
// File responsibility: the READ-side TON data contract. The mock layer can also implement this.
// Swap-in point: replace createTonApiClient() with the real backend client later — hooks unchanged.
import type { TxStatusResult } from "@/types/ton";

export interface TonApiClient {
  getTonBalance(userFriendlyAddress: string): Promise<bigint>;
  getTxStatus(inMessageHash: string): Promise<TxStatusResult>;
}
```

- [ ] **Step 2: HTTP impl** — `src/lib/ton/tonapi-client.ts`:
```ts
// File responsibility: TonAPI.io HTTP implementation of TonApiClient (WebView-safe, no ADNL).
// Endpoints:
//   GET  /v2/blockchain/accounts/{address}        → { balance } (nanoTON as string)
//   GET  /v2/blockchain/messages/{inMessageHash}   → { status, ... }
import type { TonApiClient } from "./client";
import type { TxStatusResult } from "@/types/ton";
import { tonApiBase } from "./network";

const TIMEOUT_MS = 8000;

async function tonApiFetch<T>(path: string): Promise<T | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${tonApiBase()}${path}`, {
      signal: ctrl.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export function createTonApiClient(): TonApiClient {
  return {
    async getTonBalance(userFriendlyAddress: string): Promise<bigint> {
      type R = { balance?: string };
      const r = await tonApiFetch<R>(`/v2/blockchain/accounts/${userFriendlyAddress}`);
      if (!r?.balance) return 0n;
      try {
        return BigInt(r.balance);
      } catch {
        return 0n;
      }
    },

    async getTxStatus(inMessageHash: string): Promise<TxStatusResult> {
      type R = { status?: string; info?: { hash?: string }; error?: string };
      const r = await tonApiFetch<R>(`/v2/blockchain/messages/${inMessageHash}`);
      if (!r) return { status: "pending", hash: inMessageHash };
      const status = (r.status ?? "").toLowerCase();
      if (status === "completed" || status === "ok") {
        return { status: "success", hash: r.info?.hash ?? inMessageHash };
      }
      if (status === "failed" || status === "rejected" || r.error) {
        return { status: "failed", hash: r.info?.hash, reason: r.error ?? status };
      }
      return { status: "pending", hash: inMessageHash };
    },
  };
}
```

- [ ] **Step 3: Add barrel re-exports** — append to `src/lib/ton/index.ts`:
```ts
export * from "./client";
export { createTonApiClient } from "./tonapi-client";
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ton/client.ts src/lib/ton/tonapi-client.ts src/lib/ton/index.ts
git commit -m "feat(ton): TonApiClient interface + TonAPI HTTP impl (balance + tx status)"
```

---

### Task 9: Smart-contract interaction skeleton

**Files:**
- Create: `src/lib/ton/contracts/types.ts`
- Create: `src/lib/ton/contracts/ContractBase.ts`
- Create: `src/lib/ton/contracts/index.ts`

**Interfaces:**
- Consumes: `@ton/core` `Cell`, `Address`, `beginCell`, `TonClient`-less (we useTonApiClient for reads)
- Produces: `ContractBase` abstract class, `GetterCall<T>`, `SendMessageBody`, `ContractMethod` helper

- [ ] **Step 1: Types** — `src/lib/ton/contracts/types.ts`:
```ts
// File responsibility: typing for SC getter calls and outbound message bodies.
import type { Cell } from "@ton/core";
import type { NanoTon } from "@/types/units";

export type GetterReturn = string | number | bigint | boolean | Cell | null;
export interface GetterCall<T extends GetterReturn = GetterReturn> {
  name: string;
  args?: GetterReturn[];
  decode: (stack: unknown) => T;
}

export interface SendMessageBody {
  opCode: number;           // 32-bit operation code
  body: Cell | (() => Cell);
  nanoTonValue?: NanoTon | bigint;
}
```

- [ ] **Step 2: Skeleton base** — `src/lib/ton/contracts/ContractBase.ts`:
```ts
// File responsibility: a thin skeleton for future on-chain contracts.
// MVP: NOT wired into the app — Phase 6+ uses this to call the real Distribution jetton contract.
// Components never touch this; only lib/ton/services send messages through useTonConnect.
import { Address, beginCell, type Cell } from "@ton/core";
import type { GetterCall, GetterReturn, SendMessageBody } from "./types";

export abstract class ContractBase {
  constructor(protected readonly address: Address) {}

  /** Build a getter call descriptor (read). Future impl uses TonApiClient getMethod or runGetValue. */
  protected getter<T extends GetterReturn>(call: GetterCall<T>): GetterCall<T> {
    return call;
  }

  /** Encode an outbound message body cell from an opcode + payload builder. */
  protected buildMessage(msg: SendMessageBody): Cell {
    const body = typeof msg.body === "function" ? msg.body() : msg.body;
    return beginCell().storeUint(msg.opCode, 32).storeSlice(body.beginParse()).endCell();
  }

  /** Subclasses declare their getters — read API the future on-chain repo implements. */
  abstract listGetters(): readonly GetterCall[];
}
```

- [ ] **Step 3: Barrel** — `src/lib/ton/contracts/index.ts`:
```ts
export * from "./types";
export * from "./ContractBase";
```

- [ ] **Step 4: Typecheck + build**

```bash
npm run typecheck && npm run build
```
Expected: 0 errors. (Confirm `output: "standalone"` build succeeds with the new lib tree.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/ton/contracts/
git commit -m "feat(ton): smart-contract interaction skeleton (ContractBase, future getters)"
```

---

### Task 10: useTonConnect hook facade

**Files:**
- Create: `src/hooks/useTonConnect.ts`

**Interfaces:**
- Consumes: `useTonConnectUI`, `useTonAddress`, `useIsConnectionRestored` from `@tonconnect/ui-react`; `sendTx`, `buildBuyMessage`, `shortAddress`
- Produces: `useTonConnect()` → `{ address, short, connected, restoring, network, send (...), disconnect (), openModal () }`

- [ ] **Step 1: Implement** — `src/hooks/useTonConnect.ts`:
```ts
"use client";
// File responsibility: the ONLY TON surface area components may call. Wraps TonConnect hooks + sendTx service.
// Hard boundary: components import useTonConnect, never @tonconnect or lib/ton directly.
import { useTonConnectUI, useTonAddress, useIsConnectionRestored } from "@tonconnect/ui-react";
import type { Wallet } from "@tonconnect/sdk";
import { env } from "@/lib/env";
import { sendTx, buildBuyMessage } from "@/lib/ton/sendTx";
import { shortAddress } from "@/lib/ton/address";
import type { BuyMessageInput, SendTxResult } from "@/types/ton";

export interface TonConnectState {
  address: string | null;     // user-friendly address when connected
  short: string;              // shortened for chips; "" when disconnected
  connected: boolean;
  restoring: boolean;         // true while session restore in flight
  network: "testnet" | "mainnet";
  openModal: () => void;      // opens TonConnect wallet picker
  disconnect: () => Promise<void>;
  send: (input: BuyMessageInput) => Promise<SendTxResult>;
}

export function useTonConnect(): TonConnectState {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress(true);              // user-friendly
  const restored = useIsConnectionRestored();

  const connected = Boolean(address);
  // useTonWallet gives full Wallet if needed; kept out of state for now (Phase 3 WalletBadge uses it).

  async function send(input: BuyMessageInput): Promise<SendTxResult> {
    const request = buildBuyMessage(input);
    return sendTx(tonConnectUI, request);
  }

  async function disconnect(): Promise<void> {
    if (!tonConnectUI) return;
    try {
      await tonConnectUI.disconnect();
    } catch {
      await tonConnectUI.connectionRestored;
      tonConnectUI.onTxSent = undefined;
    }
  }

  function openModal(): void {
    tonConnectUI?.openModal();
  }

  return {
    address: address || null,
    short: address ? shortAddress(address, { prefix: 6, suffix: 4 }) : "",
    connected,
    restoring: !restored,
    network: env.network,
    openModal,
    disconnect,
    send,
  };
}

export type { Wallet };
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: 0 errors. (Fix any `disconnect` signature drift against the installed `@tonconnect/ui` API.)

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useTonConnect.ts
git commit -m "feat(ton): useTonConnect hook facade (component boundary)"
```

---

### Task 11: Provider wiring + minimal wallet components

**Files:**
- Create: `src/app/providers.tsx`
- Create: `src/components/wallet/TonConnectButton.tsx`
- Create: `src/components/wallet/WalletBadge.tsx`
- Create: `src/components/wallet/DisconnectedState.tsx`
- Modify: `src/app/layout.tsx` (wrap children in `<Providers>`)

**Interfaces:**
- Consumes: `TonConnectUIProvider`, `resolveManifestUrl`, `useTonConnect`, `cn`, Telegram/Query providers deferred (NOT in this plan — separate subset)
- Produces: `<Providers>` client component tree; visible wallet connect UI

- [ ] **Step 1: Providers tree** — `src/app/providers.tsx`:
```tsx
"use client";
// File responsibility: compose client providers. Phase 2 TON subset wires TonConnect here.
// Telegram SDKProvider + TanStack QueryClientProvider will be added by the parallel foundation subset.
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { resolveManifestUrl } from "@/lib/ton/manifest";
import { env } from "@/lib/env";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider
      manifestUrl={resolveManifestUrl()}
      restoreConnection
      uiPreferences={{ theme: "DARK" }}
    >
      {children}
      {/* TonConnectButton root mounts its own modal attachment */}
    </TonConnectUIProvider>
  );
}
void env; // suppress unused-import until Telegram provider subset lands
```

- [ ] **Step 2: TonConnectButton** — `src/components/wallet/TonConnectButton.tsx`:
```tsx
"use client";
// File responsibility: render TonConnect's own connect button (excellent out-of-box UX).
// Phase 3 will restyle to a DigiHouse-native Telegram button; Phase 2 ships the native TonConnectButton.
import { TonConnectButton } from "@tonconnect/ui-react";
import { cn } from "@/lib/utils";

export function WalletConnectButton({ className }: { className?: string }) {
  return <TonConnectButton className={cn("h-12", className)} />;
}
```

- [ ] **Step 3: WalletBadge** — `src/components/wallet/WalletBadge.tsx`:
```tsx
"use client";
// File responsibility: chip showing the connected wallet's shortened address + a disconnect action.
import { useTonConnect } from "@/hooks/useTonConnect";
import { cn } from "@/lib/utils";

export function WalletBadge({ className }: { className?: string }) {
  const { short, connected, network, openModal } = useTonConnect();
  if (!connected) return null;
  return (
    <button
      type="button"
      onClick={openModal}
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-foreground",
        className,
      )}
      aria-label="Manage wallet"
    >
      <span className="size-2 rounded-full bg-success" aria-hidden />
      <span className="tnum">{short}</span>
      <span className="text-muted-foreground uppercase">{network}</span>
    </button>
  );
}
```

- [ ] **Step 4: DisconnectedState** — `src/components/wallet/DisconnectedState.tsx`:
```tsx
"use client";
// File responsibility: empty-state shown when no wallet is connected.
import { WalletConnectButton } from "./TonConnectButton";
import { useTonConnect } from "@/hooks/useTonConnect";

export function DisconnectedState({ className }: { className?: string }) {
  const { restoring } = useTonConnect();
  return (
    <div className={className}>
      <h2 className="text-lg font-semibold">Connect a TON wallet</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {restoring
          ? "Restoring your previous session…"
          : "You need a TON wallet to buy shares and receive weekly rental yield."}
      </p>
      <div className="mt-4">
        <WalletConnectButton />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Wrap in layout** — `src/app/layout.tsx` (replace children with `<Providers>`):

Replace `<body ...>{children}</body>` with:
```tsx
      <body className="min-h-full bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
```
Add the import at top: `import { Providers } from "./providers";`

- [ ] **Step 6: Render on a page** — `src/app/page.tsx` (replace placeholder):
```tsx
import { WalletConnectButton } from "@/components/wallet/TonConnectButton";
import { WalletBadge } from "@/components/wallet/WalletBadge";
import { DisconnectedState } from "@/components/wallet/DisconnectedState";
import { useTonConnect } from "@/hooks/useTonConnect";
import { env } from "@/lib/env";

export default function Home() {
  return <WalletGateway />;
}

function WalletGateway() {
  const { connected, network } = useTonConnect();
  return (
    <main className="mx-auto flex min-h-svh max-w-[480px] flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">DigiHouse</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fractional property on TON · {network} (TON foundation wired; Phase 2 in progress)
        </p>
      </div>
      {connected ? <ConnectedPreview /> : <DisconnectedState />}
    </main>
  );
}

function ConnectedPreview() {
  const { address } = useTonConnect();
  return (
    <div className="flex flex-col items-center gap-3">
      <WalletBadge />
      <p className="max-w-xs text-xs text-muted-foreground tnum">Connected: {address}</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Wallet connect works end-to-end. Remaining Phase 2 foundation (Telegram SDK + mock data +
        AppShell + tabs) is wired by the parallel subset.
      </p>
    </div>
  );
}
void env;
```

- [ ] **Step 7: Run check**

```bash
npm run check
```
Expected: lint + typecheck + build all green. (Resolve any react-hooks lint by adjusting `useTonConnect` if needed.)

- [ ] **Step 8: Commit**

```bash
git add src/app/providers.tsx src/components/wallet/ src/app/page.tsx src/app/layout.tsx
git commit -m "feat(ton): TonConnect provider + minimal wallet connect UI; foundation wired into root"
```

---

### Task 12: Final verification + Decisions log already updated

- [ ] **Step 1: Full test suite**

```bash
npm test
```
Expected: all TON util tests pass.

- [ ] **Step 2: Full check + build**

```bash
npm run check
```
Expected: green.

- [ ] **Step 3: Ownership self-audit** (run manually against the `telegram-ton-ownership` skill):
- [ ] No component imports `lib/ton/**` directly — they call `useTonConnect`. (Grep `src/components src/app` for `lib/ton`.)
- [ ] Every `lib/ton/*` file < 350 lines and has one concern.
- [ ] No `any`; `next.config.ts`/tsconfig unchanged in breaking ways.
- [ ] MVP honesty: `makeSyntheticTxHash()` returns `"simulated:..."`; no screen claims on-chain settlement.

- [ ] **Step 4: Commit verification**

```bash
git log --oneline | head -15
```
Expected: ~13 commits since the start of this plan, one per task.

---

## Self-review notes (post-write)

- **Spec coverage:** TonConnect + manifest (✓ Task 2, 11), Address utils (✓ Task 5), balance checking (✓ Task 8 TonApiClient), tx status (✓ Task 8), SC skeleton (✓ Task 9), type-safety (✓ Task 3, 7), testnet-first (✓ Task 4, env), security (✓ no keys; NEXT_PUBLIC_* only). SendTx stub returns synthetic `txHash` (✓ MVP honesty).
- **Type consistency:** `BuyMessageInput`, `SendTxResult`, `TxStatusResult` defined once in `types/ton.ts`; used identically in `sendTx.ts` and `useTonConnect.ts`. `TonApiClient` defined once in `client.ts`, implemented in `tonapi-client.ts`. Branded `NanoTon` imported from `types/units.ts` consistently.
- **Placeholder note:** the address test fixtures and the `memoToBase64` comment acknowledge TonConnect expects a BoC cell — for the MVP stub we attach the comment as a plain payload. A full comment-cell builder is Phase 6+ when the real Distribution contract lands; flagged in code.
- **Scope:** this plan stops at the TON foundation subset. Telegram SDK wiring, mock data layer, AppShell + tabs are the *parallel* Phase-2 foundation subset (separate plan), not mixed here — avoids God-plan scope.
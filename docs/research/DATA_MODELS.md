# DATA MODELS — DigiHouse

> Shared TypeScript vocabulary for the core domain. Agents MUST import/satisfy these
> interfaces to keep types consistent across screens, the mock layer, and the future backend.
> Keep mirrored types in `src/types/`. **No `any`.** Money is integer minor units (cents).

## Units & conventions
- **Money:** integer minor units (cents) — e.g. `12500` = `$125.00`. Display divides by 100 via `format.usd`. Never store/compare floats.
- **TON amounts:** integer **nanoTON** (`1 TON = 1e9 nanoTON`). Display via `format.ton`.
- **Shares:** integer counts. 1 share = smallest ownable unit; `sharesRemaining = totalShares - sharesSold`.
- **Ratios:** stored as a float `0..1` and named with a `…Ratio` suffix (e.g. `fundingProgressRatio`, `shareRatio`). Never percentages as numbers >1.
- **Dates:** ISO-8601 strings (`createdAt`, `weekOf`). `weekOf` always = the Monday 00:00 UTC of that distribution week.
- **IDs:** stable string IDs. `UserProfile.id` = the Telegram user id (string) from launch params.

## Branded numeric helpers (recommended)
```ts
// src/types/units.ts — discourages mixing money with nanoTON with shares at the type level.
export type Usd = number & { __brand: "usd" };       // minor units (cents)
export type NanoTon = number & { __brand: "nanoTon" };
export type Shares = number & { __brand: "shares" };
```
MVP may use plain `number` if branded helpers aren't wired yet, but all field JSDoc MUST state the unit.

---

## Core interfaces

### User
```ts
// src/types/user.ts
export type UserRole = "investor" | "owner";

export interface UserProfile {
  id: string;                    // Telegram user id (string)
  displayName: string;           // from Telegram initData
  username?: string;             // @handle, if available
  photoUrl?: string;             // Telegram avatar URL
  role: UserRole;
  walletAddress: string | null;  // TON address (user-friendly or raw) / null when disconnected
  onboarded: boolean;            // false until role selected
  useTelegramTheme: boolean;     // Settings toggle (default false → DigiHouse static palette)
  createdAt: string;             // ISO
}
```

### Property / Listing
```ts
// src/types/property.ts
export type PropertyStatus = "funding" | "funded" | "resale";

export interface Property {
  id: string;
  title: string;
  location: string;
  description: string;
  images: string[];             // first = hero, 16:10 thumbs in /public/images/properties
  totalShares: number;
  sharePriceUsd: number;       // minor units per share
  status: PropertyStatus;
  ownerWalletAddress: string;  // TON address receiving funding
  createdAt: string;            // ISO
}

export interface Listing extends Property {
  sharesSold: number;
  sharesRemaining: number;
  fundingProgressRatio: number; // 0..1
}
```

### Order & Order Book
```ts
// src/types/order.ts
export type OrderSide = "buy" | "sell";
export type OrderStatus = "open" | "filled" | "cancelled" | "rejected";

export interface Order {
  id: string;
  propertyId: string;
  side: OrderSide;
  priceUsd: number;            // minor units, price per share
  quantity: number;            // shares requested
  filledQuantity: number;      // shares filled so far
  status: OrderStatus;
  ownerWalletAddress: string; // the placer's TON address
  createdAt: string;           // ISO
}

export interface OrderBookLevel {
  priceUsd: number;            // minor units
  quantity: number;            // shares remaining at this level
  cumulative: number;          // cumulative shares available up to this level
}

export interface OrderBookState {
  propertyId: string;
  bids: OrderBookLevel[];      // sorted DESC by price (best bid first)
  asks: OrderBookLevel[];      // sorted ASC by price (best ask first)
  bestBidUsd?: number;
  bestAskUsd?: number;
  lastTradeUsd?: number;
}
```

### Position / Portfolio
```ts
// src/types/position.ts
export interface Holding {
  propertyId: string;
  sharesOwned: number;
  avgCostUsd: number;            // minor units per share (avg)
  currentValueUsd: number;       // minor units total market value
  pendingWeekEarningsUsd: number; // minor units, next distribution
  shareRatio: number;            // 0..1 — sharesOwned / property.totalShares
}

export interface PortfolioSummary {
  totalValueUsd: number;        // minor units
  totalInvestedUsd: number;     // minor units
  totalEarningsUsd: number;     // all-time minor units
  weeklyProjectedUsd: number;    // next-week projection, minor units
  holdings: Holding[];
  openOrders: Order[];
}
```

### Earnings
```ts
// src/types/earnings.ts
export type EarningsStatus = "paid" | "pending";

export interface EarningsEntry {
  id: string;
  propertyId: string;
  weekOf: string;               // ISO Monday date
  amountUsd: number;           // minor units paid this week
  tonAmount: number;            // nanoTON, for the TON-estimate line
  shareRatio: number;           // 0..1 — user's share of the property for that week
  status: EarningsStatus;
}

export interface EarningsSummary {
  allTimeUsd: number;
  thisWeekUsd: number;
  projectedNextWeekUsd: number;
  entries: EarningsEntry[];     // newest first, grouped by week
}
```

### Transaction
```ts
// src/types/transaction.ts
export type TxKind = "buy" | "sell" | "earnings" | "withdraw";
export type TxStatus = "pending" | "success" | "failed";

export interface Transaction {
  id: string;
  kind: TxKind;
  propertyId?: string;
  shares?: number;
  amountUsd: number;            // minor units
  tonAmount?: number;          // nanoTON
  status: TxStatus;
  txHash?: string;             // TON boc hash when on-chain
  createdAt: string;           // ISO
  error?: string;              // human-readable failure reason
}
```

### Telegram / theme integration types
```ts
// src/types/telegram.ts
export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  accent_text_color?: string;
  destructive_text_color?: string;
  header_background_color?: string;
  link_color?: string;
}

export type HapticStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
export type HapticNotification = "error" | "success" | "warning";
```

---

## Display helpers (`src/lib/format.ts`)
```ts
export const usd = (minor: number) =>
  `$${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const ton = (nano: number) =>
  `${(nano / 1e9).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} TON`;
export const shortAddr = (a: string) =>
  a.length <= 8 ? a : `${a.slice(0, 4)}…${a.slice(-4)}`;
export const pct = (r: number) => `${(r * 100).toFixed(r < 0.1 ? 1 : 0)}%`;
export const weekLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
```
All money/TON outputs MUST be wrapped in a `.tnum` span (`font-variant-numeric: tabular-nums`).

---

## Repository contracts (hide the mock swap behind these)
```ts
// src/lib/api/repos.ts
export interface MarketplaceRepo {
  list(filter?: { status?: PropertyStatus; query?: string }): Promise<Listing[]>;
  get(propertyId: string): Promise<Listing>;
}

export interface OrderBookRepo {
  get(propertyId: string): Promise<OrderBookState>;
  placeOrder(input: { propertyId: string; side: OrderSide; priceUsd: number; quantity: number }): Promise<Order>;
  cancelOrder(orderId: string): Promise<void>;
}

export interface PortfolioRepo {
  summary(): Promise<PortfolioSummary>;
}

export interface EarningsRepo {
  summary(): Promise<EarningsSummary>;
}

export interface TxRepo {
  buy(input: { propertyId: string; quantity: number; priceUsdPerShare: number }): Promise<Transaction>;
  // sell returns the created resting order; "earnings"/"withdraw" are future
}
```

## Persistence notes
- MVP uses a **mock data layer** (`src/lib/mock/*.ts`) implementing the repository contracts above, with realistic async delays (`await sleep(n)`).
- Provide a single `getRepo()` injection point so replacing the mock with the real TON/backend is a one-folder change.
- All async data flows through TanStack Query hooks (`src/hooks/*`) — **components never import the mock layer directly.**
- Mock seed invariants (every UI state must render): ≥6 properties spanning `funding` + `funded` + `resale`; an order book per property; one logged-in investor with ≥2 holdings + ≥4 weekly earnings entries; ≥1 open order; at least one failed/pending transaction example for the error/pending states.
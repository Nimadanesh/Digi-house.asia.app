# DATA MODELS — DigiHouse

> Shared TypeScript vocabulary for the core domain. Agents MUST import/satisfy these
> interfaces to keep types consistent across screens, the mock layer, and the future backend.
> Keep mirrored types in `src/types/`. **No `any`.** Money is integer minor units (cents).
>
> Each model is described in **three layers**: **App/UI type** (what the frontend imports), **Database shape** (what a backend/postgres would store), and **On-chain shape** (what a future TON smart contract would hold). MVP runs only the App layer against a mock repo; the DB and on-chain columns define the contract the real swap-in must honor.

## Units & conventions
- **Money:** integer minor units (cents) — e.g. `12500` = `$125.00`. Display divides by 100 via `format.usd`. Never store/compare floats.
- **TON amounts:** integer **nanoTON** (`1 TON = 1e9 nanoTON`).
- **Shares:** integer counts. 1 share = smallest ownable unit; `sharesRemaining = totalShares - sharesSold`.
- **Ratios:** stored as a float `0..1` and named with a `…Ratio` suffix (e.g. `fundingProgressRatio`, `shareRatio`). Never percentages as numbers >1.
- **Dates:** ISO-8601 strings (`createdAt`, `weekOf`). `weekOf` always = the Monday 00:00 UTC of that distribution week (Friday payout belongs to the week that started Monday).
- **IDs:** stable string IDs. `UserProfile.id` = the Telegram user id (string) from launch params. Property/Order/Earnings IDs are stable opaque strings in MVP; on-chain swap uses the TON jetton/contract address as the canonical ID.

## Branded numeric helpers (recommended)
```ts
// src/types/units.ts — discourages mixing money with nanoTON with shares at the type level.
export type Usd = number & { __brand: "usd" };       // minor units (cents)
export type NanoTon = number & { __brand: "nanoTon" };
export type Shares = number & { __brand: "shares" };
```
MVP may use plain `number` if branded helpers aren't wired yet, but all field JSDoc MUST state the unit.

---

## Entity map
```
UserProfile ──< Holding >── Property (Listing)
                  │            │
                  │            └─< Order (order book) ──< Fill (Transaction)
                  │
                  └─< EarningsEntry (weekly payout) ──< RentalDistribution
```
- A **User** owns **Holdings** (shares of a **Property**).
- A **Property** has an **Order Book** of **Orders**; matched orders produce **Transactions** (Fills).
- Each Friday, a **RentalDistribution** (per property) spawns **EarningsEntry** rows (per shareholder) and a payout **Transaction** to each wallet.

---

## 1. User

### App/UI type
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

### Database shape
Table `users`
| column | type | notes |
|---|---|---|
| `id` | text PK | Telegram user id |
| `display_name` | text | |
| `username` | text null | |
| `photo_url` | text null | |
| `role` | text CHECK in (`investor`,`owner`) | |
| `wallet_address` | text null | TON friendly/raw, indexed |
| `onboarded` | boolean default false | |
| `use_telegram_theme` | boolean default false | |
| `created_at` | timestamptz | |

### On-chain shape
- No direct on-chain User entity. Identity = the TON wallet address bound in the off-chain `users` row. A future SBT ("DigiHouse Membership") could mirror `role` on-chain, out of scope for MVP.

---

## 2. Property / Listing

### App/UI type
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
  annualRentUsd: number;        // minor units — yearly rent the property pays out
  createdAt: string;            // ISO
}

export interface Listing extends Property {
  sharesSold: number;
  sharesRemaining: number;
  fundingProgressRatio: number; // 0..1
}
```
**Derived weekly rent**: `weeklyRentUsd = floor(annualRentUsd / 52)`. Per-share weekly yield = `weeklyRentUsd × shareRatio` for a holder owning `shareRatio` of `totalShares`.

### Database shape
Table `properties`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `title` | text | |
| `location` | text | |
| `description` | text | |
| `images` | jsonb (text[]) | |
| `total_shares` | integer | |
| `share_price_usd` | bigint | minor units |
| `status` | text CHECK | funding/funded/resale |
| `owner_wallet_address` | text | |
| `annual_rent_usd` | bigint | minor units |
| `created_at` | timestamptz | |

Table `property_images` (normalized alt)
| `property_id` FK | `url` text | `position` int |

### On-chain shape (future TON contract — documented, not MVP)
- A **property** is represented by a **jetton master** (TON fungible token) whose total supply = `totalShares`.
- Master metadata (cell): `title`, `location`, `share_price_ton` (≈ USD→TON snapshot converted), `annual_rent_nano_ton`, `owner_wallet`, `funding_status`.
- Funding period: investors buy jettons directly from the master at `sharePriceUsd` (USD→TON conversion at TX time). When `supply - minted == 0`, status flips to `funded`.
- Resale: jettons trade peer-to-peer; the jetton master is unchanged; an **order-book contract** (or off-chain matching + on-chain settlement) handles fills.
- **Weekly rent** is held as **nanoTON** in a **Distribution Contract** associated with the property (see §6 below).

---

## 3. Fraction Token (the on-chain share)
> App layer is share-count-only; this entity exists to document the on-chain representation.

```ts
// src/types/fractionToken.ts (documentation only for MVP)
// Mirrors a TON jetton wallet record for a holder on a given property.
export interface FractionTokenWallet {
  propertyId: string;     // canonical on-chain = jetton master address
  ownerAddress: string;    // TON wallet
  balance: number;         // shares (= jetton balance)
}
```
- **MVP:** the app simply trusts `Holding.sharesOwned` from the off-chain/mock ledger; `FractionTokenWallet` will become authoritative once the jetton master is deployed.
- **On-chain:** each investor holds a jetton **wallet contract** for the property's jetton master. Balance = owned shares. Transfers = sales. Burns are not allowed except on owner redemption (post-MVP).

---

## 4. Order & Order Book
### App/UI type
```ts
// src/types/order.ts
export type OrderSide = "buy" | "sell";
export type OrderStatus = "open" | "filled" | "cancelled" | "rejected";

export interface Order {
  id: string;
  propertyId: string;
  makerAddress: string;     // wallet that placed order
  side: OrderSide;
  priceUsd: number;            // minor units, price per share
  quantity: number;            // shares requested
  filledQuantity: number;      // shares filled so far
  status: OrderStatus;
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

### Database shape
Table `orders`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `property_id` | uuid FK | |
| `maker_address` | text | TON address |
| `side` | text CHECK buy/sell | |
| `price_usd` | bigint | minor units |
| `quantity` | integer | |
| `filled_quantity` | integer default 0 | |
| `status` | text CHECK | open/filled/cancelled/rejected |
| `created_at` | timestamptz | |

Table `fills` (trade history)
| `id` uuid PK | `property_id` FK | `buy_order_id` FK | `sell_order_id` FK | `price_usd` bigint | `quantity` int | `tx_hash` text | `created_at` timestamptz |

### On-chain shape
- **MVP:** off-chain matching (mock). Real swap = an order-book contract (or Hydra-style matching) where resting orders lock funds; a fill executes a single on-chain jetton swap atomically. Settlement TX hash is stored in `fills.tx_hash`.

---

## 5. Holding / Position / Portfolio
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

### Database shape
Table `holdings`
| `user_id` FK | `property_id` FK | `shares_owned` int | `avg_cost_usd` bigint | `updated_at` timestamptz | PK(`user_id`,`property_id`)
- `share_ratio` and `current_value_usd` are **derived**, not stored (recompute from live order book / property base price).
- `pending_week_earnings_usd` derived from the property's `weeklyRentUsd` × `share_ratio` for the active `RentalDistribution`.

---

## 6. Rental Income Distribution (the hero on-chain entity)
### App/UI type
```ts
// src/types/earnings.ts
export type EarningsStatus = "paid" | "pending";

export interface EarningsEntry {
  id: string;
  userId: string;
  propertyId: string;
  weekOf: string;               // ISO Monday date
  amountUsd: number;           // minor units paid this week
  tonAmount: number;            // nanoTON, for the TON-estimate line
  shareRatio: number;           // 0..1 — user's share of the property for that week
  status: EarningsStatus;
  txHash?: string;             // TON boc hash when paid out on-chain
}

export interface EarningsSummary {
  allTimeUsd: number;
  thisWeekProjectedUsd: number;   // THIS week's projection (not a paid figure) — minor units
  projectedNextWeekUsd: number;
  entries: EarningsEntry[];     // newest first, grouped by week
}

// Aggregate record per property per week (off-chain ledger of the payout)
export interface RentalDistribution {
  id: string;                   // = `${propertyId}#${weekOf}`
  propertyId: string;
  weekOf: string;               // ISO Monday
  rentPoolUsd: number;          // minor units collected this week (rent ÷ 52)
  rentPoolNanoTon: number;
  payoutDay: string;            // ISO Friday for the week
  status: "scheduled" | "distributing" | "completed";
  totalShares: number;         // snapshot of total shares at payout time
  createdAt: string;
}
```
**Proportional invariant (must hold for every entry):**
```
EarningsEntry.amountUsd == floor(
  RentalDistribution.rentPoolUsd × (EarningsEntry.shareRatio)
)
where shareRatio = sharesOwned / RentalDistribution.totalShares
```
This equation is the **judge-verifiable truth** referenced from R-6 in [REQUIREMENTS](./REQUIREMENTS.md) and Flow 2 in [USER_FLOW](./USER_FLOW.md).

**Dust policy:** any remainder left after summing all `floor(rentPoolUsd × shareRatio)` entries (the sub-cent dust that integer division drops) accrues to the **last or largest holder** for that distribution — i.e. the largest `shareRatio`; ties broken by insertion order. This keeps `ΣamountUsd == rentPoolUsd` exactly (judge-verifiable) without losing dust.

### Database shape
Table `rental_distributions`
| column | type | notes |
|---|---|---|
| `id` | text PK | `${property_id}#${week_of}` |
| `property_id` | uuid FK | |
| `week_of` | date | Monday |
| `rent_pool_usd` | bigint | minor units |
| `rent_pool_nano_ton` | bigint | |
| `payout_day` | date | Friday that week |
| `status` | text CHECK | scheduled/distributing/completed |
| `total_shares` | integer | snapshot |
| `created_at` | timestamptz | |

Table `earnings_entries`
| `id` uuid PK | `user_id` FK | `property_id` FK | `distribution_id` FK | `week_of` date | `amount_usd` bigint | `ton_amount` bigint | `share_ratio` numeric(6,5) | `status` text | `tx_hash` text null | `created_at` timestamptz |
- Unique (`user_id`,`distribution_id`) — one entry per shareholder per distribution.
- A precomputed `earnings_entries` row for a `scheduled` distribution is the "Pending" status; flips to `paid` once the on-chain payout TX lands.

### On-chain shape (future TON contract — documented, not MVP)
- A **Distribution Contract** per property holds the weekly rent in **nanoTON**.
- Every Friday (cron or a TON kickoff message), the contract iterates jetton holders and sends each one `rentPoolNanoTon × (holder.balance / totalSupply)`. Alternatively, a claimable pattern where each shareholder pulls their payout — cheaper gas at scale.
- Each successful transfer emits a **body** with `propertyId`, `weekOf`, `shareRatio`, so `EarningsEntry.txHash` can be proven from the chain.
- **MVP simulates this**: the mock `EarningsRepo` flips entries from `pending` → `paid` on the cadence and stamps a synthetic `txHash` placeholder.

---

## 7. Transaction
```ts
// src/types/transaction.ts
export type TxKind = "buy" | "sell" | "earnings" | "withdraw";
export type TxStatus = "pending" | "success" | "failed";

export interface Transaction {
  id: string;
  kind: TxKind;
  propertyId?: string;
  userId: string;
  shares?: number;
  amountUsd: number;            // minor units
  tonAmount?: number;          // nanoTON
  status: TxStatus;
  txHash?: string;             // TON boc hash when on-chain
  error?: string;              // human-readable failure reason
  createdAt: string;           // ISO
}
```

### Database shape
Table `transactions`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | FK | |
| `kind` | text CHECK buy/sell/earnings/withdraw | |
| `property_id` | uuid null FK | |
| `shares` | integer null | |
| `amount_usd` | bigint | minor units |
| `ton_amount` | bigint null | |
| `status` | text CHECK pending/success/failed | |
| `tx_hash` | text null | |
| `error` | text null | |
| `created_at` | timestamptz | |

### On-chain shape
- Each `tx_hash` is a TON transaction BOC hash. For `earnings` and `withdraw`, the hash corresponds to the payout message from the Distribution contract / owner withdrawal.
- A failed/pending TX in MVP simulates a real on-chain error so the error-state UI ships.

---

## 8. Telegram / theme integration types
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
export const weeklyRent = (annualRentUsd: number) =>
  Math.floor(annualRentUsd / 52);
export const projectedYield = (
  weeklyRentUsd: number,
  sharesOwned: number,
  totalShares: number
) => (totalShares > 0 ? Math.floor(weeklyRentUsd * (sharesOwned / totalShares)) : 0);
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
  tickPayout(): Promise<{ distributionId: string; paidEntries: number }>; // mock scheduler flips pending→paid
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
- Mock seed invariants (every UI state must render):
  - ≥6 properties spanning `funding` + `funded` + `resale`, each with a non-zero `annualRentUsd`.
  - An order book per property.
  - One logged-in investor with ≥2 holdings + ≥4 weekly `EarningsEntry` rows (mix of `paid` and `pending` spanning ≥4 weeks).
  - ≥1 `RentalDistribution` per owned property per seeded week.
  - ≥1 open order.
  - At least one failed and one pending `Transaction` for the error/pending states.

## MVP vs. real swap — summary
| Concern | MVP (mock) | Real (TON + backend) |
|---|---|---|
| Share ownership | `Holding` row off-chain | Jetton balance on each property master |
| Buy TX | TonConnect connect + stub tx | Real jetton mint from master |
| Order matching | Off-chain `placeOrder` (simulated fills) | On-chain order-book / Hydra matching |
| **Weekly distribution** | `EarningsRepo.tickPayout()` flips pending→paid, stamps synthetic hash | Distribution contract pays nanoTON per share on Friday |
| Proportional math | Computed in app from `shareRatio` | Enforced by contract `balance/totalSupply` |
| Trust | Explainer line + live math | Verifiable TON BOC hash per `EarningsEntry.txHash` |
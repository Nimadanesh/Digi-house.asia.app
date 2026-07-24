// File responsibility: deterministic seed generator (every UI state reachable).
import type { Listing } from "@/types/property";
import type { Order, OrderBookState, OrderBookLevel } from "@/types/order";
import type { Holding, PortfolioSummary } from "@/types/position";
import type { EarningsEntry, EarningsSummary, RentalDistribution } from "@/types/earnings";
import type { Transaction } from "@/types/transaction";
import type { UserProfile } from "@/types/user";
import { makeSyntheticTxHash } from "@/lib/ton/sendTx";

// Notional FX rate for MVP seed math: 1 TON = $2.00 (200 minor). nanoTON per minor cent = 1e9 / 200.
const NANO_PER_USD_MINOR = 5_000_000;

const PROPERTIES: Listing[] = [
  {
    id: "prop-marina-vista-4b",
    title: "Marina Vista Apt 4B",
    location: "Dubai Marina, UAE",
    description: "Waterfront one-bedroom with marina view and 24h concierge.",
    images: [
      "/images/properties/prop-marina-vista-4b-1.webp",
      "/images/properties/prop-marina-vista-4b-2.webp",
      "/images/properties/prop-marina-vista-4b-3.webp",
    ],
    totalShares: 1000,
    sharePriceUsd: 12500,
    status: "funding",
    ownerWalletAddress: "EQARULx2r6JmOuMoQn7jVr8m9Rrjv0s4kq5t8s7q5t8s4kq5",
    annualRentUsd: 520000,
    createdAt: "2026-01-12T09:00:00Z",
    sharesSold: 640,
    sharesRemaining: 360,
    fundingProgressRatio: 0.64,
  },
  {
    id: "prop-soho-loft-studio",
    title: "Soho Loft Studio",
    location: "Lisbon, Portugal",
    description: "Renovated Alfama studio steps from the Tagus riverside promenade.",
    images: [
      "/images/properties/prop-soho-loft-studio-1.webp",
      "/images/properties/prop-soho-loft-studio-2.webp",
    ],
    totalShares: 800,
    sharePriceUsd: 15000,
    status: "funding",
    ownerWalletAddress: "EQBQbP3KsN8tVq2WdTeHcYx4Zp1mK0vR7nAeL9fS2hBkR8sT",
    annualRentUsd: 624000,
    createdAt: "2026-02-08T10:30:00Z",
    sharesSold: 320,
    sharesRemaining: 480,
    fundingProgressRatio: 0.4,
  },
  {
    id: "prop-bayside-marina-penthouse",
    title: "Bayside Marina Penthouse",
    location: "São Paulo, Brazil",
    description: "Top-floor two-bedroom penthouse overlooking the Pinheiros marina.",
    images: [
      "/images/properties/prop-bayside-marina-penthouse-1.webp",
      "/images/properties/prop-bayside-marina-penthouse-2.webp",
      "/images/properties/prop-bayside-marina-penthouse-3.webp",
    ],
    totalShares: 800,
    sharePriceUsd: 25000,
    status: "funded",
    ownerWalletAddress: "EQCDf8Kq2tYpR7vWnL3xJmH0bZ5sAeN9oVgB4uTr6pXkMdH1",
    annualRentUsd: 1040000,
    createdAt: "2026-03-04T08:15:00Z",
    sharesSold: 800,
    sharesRemaining: 0,
    fundingProgressRatio: 1,
  },
  {
    id: "prop-alfama-terrace-flat",
    title: "Alfama Terrace Flat",
    location: "Lisbon's Alfama district, Portugal",
    description: "Charming renovated flat with a private terrace above Alfama's lanes.",
    images: [
      "/images/properties/prop-alfama-terrace-flat-1.webp",
      "/images/properties/prop-alfama-terrace-flat-2.webp",
    ],
    totalShares: 1000,
    sharePriceUsd: 10000,
    status: "funded",
    ownerWalletAddress: "EQDr5YpN3vKq8tWcRx2mH0kJbZ4sAeF1oVgB7uTr9pXkMdH2",
    annualRentUsd: 1300000,
    createdAt: "2026-04-18T11:45:00Z",
    sharesSold: 1000,
    sharesRemaining: 0,
    fundingProgressRatio: 1,
  },
  {
    id: "prop-tbilisi-riverhouse-loft",
    title: "Tbilisi Riverhouse Loft",
    location: "Tbilisi, Georgia",
    description: "Open-plan loft on the Mtkvari riverfront with skyline views.",
    images: [
      "/images/properties/prop-tbilisi-riverhouse-loft-1.webp",
      "/images/properties/prop-tbilisi-riverhouse-loft-2.webp",
    ],
    totalShares: 600,
    sharePriceUsd: 8000,
    status: "resale",
    ownerWalletAddress: "EQFw6TqL4yNvRp8cQx1mK0jHbZ3sAeF2oVgB5uTr7pXkMdH3",
    annualRentUsd: 468000,
    createdAt: "2025-12-02T07:20:00Z",
    sharesSold: 600,
    sharesRemaining: 0,
    fundingProgressRatio: 1,
  },
  {
    id: "prop-canggu-surf-villa",
    title: "Canggu Surf Villa",
    location: "Bali, Indonesia",
    description: "Four-bedroom villa minutes from Batu Bolong beach and rice paddies.",
    images: [
      "/images/properties/prop-canggu-surf-villa-1.webp",
      "/images/properties/prop-canggu-surf-villa-2.webp",
      "/images/properties/prop-canggu-surf-villa-3.webp",
    ],
    totalShares: 1200,
    sharePriceUsd: 20000,
    status: "resale",
    ownerWalletAddress: "EQGp9UrM6xNwTs7dSy3nK1lHcZ5sAeF3oVgB6uTr8pXkMdH4",
    annualRentUsd: 936000,
    createdAt: "2026-01-30T14:10:00Z",
    sharesSold: 1200,
    sharesRemaining: 0,
    fundingProgressRatio: 1,
  },
];

const USER: UserProfile = {
  id: "user-aria-demo",
  displayName: "Aria Demo",
  username: "ariademo",
  role: "investor",
  walletAddress: "EQHq2VsN7yKwTp8rUy4mL0kHbZ6sAeF4oVgB8uTr9pXkMdH5",
  onboarded: true,
  useTelegramTheme: false,
  createdAt: "2026-03-10T12:00:00Z",
};

// Two holdings, each referencing one of the funded properties.
const HOLDINGS: Holding[] = [
  {
    propertyId: "prop-bayside-marina-penthouse",
    sharesOwned: 60,
    avgCostUsd: 25000,
    currentValueUsd: 60 * 25000,
    pendingWeekEarningsUsd: 1500,
    shareRatio: 0.075,
  },
  {
    propertyId: "prop-alfama-terrace-flat",
    sharesOwned: 75,
    avgCostUsd: 10000,
    currentValueUsd: 75 * 10000,
    pendingWeekEarningsUsd: 1875,
    shareRatio: 0.075,
  },
];

// Weekly payout (minor units) per holding: (annualRentUsd / 52) * shareRatio.
const PAYOUT_BAYSIDE = 1500; // 20000 pool * 0.075
const PAYOUT_ALFAMA = 1875; // 25000 pool * 0.075
const TON_BAYSIDE = PAYOUT_BAYSIDE * NANO_PER_USD_MINOR;
const TON_ALFAMA = PAYOUT_ALFAMA * NANO_PER_USD_MINOR;

// ISO Mondays spanning >=4 distinct weeks, most recent = 2026-07-20.
const WEEKS = [
  "2026-06-29T00:00:00Z",
  "2026-07-06T00:00:00Z",
  "2026-07-13T00:00:00Z",
  "2026-07-20T00:00:00Z",
];

// 8 entries: 6 paid (weeks 1-3) + 2 pending (week 4, most recent).
const EARNINGS_ENTRIES: EarningsEntry[] = [
  {
    id: "earn-bayside-2026-06-29",
    userId: USER.id,
    propertyId: "prop-bayside-marina-penthouse",
    weekOf: WEEKS[0],
    amountUsd: PAYOUT_BAYSIDE,
    tonAmount: TON_BAYSIDE,
    shareRatio: 0.075,
    status: "paid",
    txHash: makeSyntheticTxHash(),
  },
  {
    id: "earn-alfama-2026-06-29",
    userId: USER.id,
    propertyId: "prop-alfama-terrace-flat",
    weekOf: WEEKS[0],
    amountUsd: PAYOUT_ALFAMA,
    tonAmount: TON_ALFAMA,
    shareRatio: 0.075,
    status: "paid",
    txHash: makeSyntheticTxHash(),
  },
  {
    id: "earn-bayside-2026-07-06",
    userId: USER.id,
    propertyId: "prop-bayside-marina-penthouse",
    weekOf: WEEKS[1],
    amountUsd: PAYOUT_BAYSIDE,
    tonAmount: TON_BAYSIDE,
    shareRatio: 0.075,
    status: "paid",
    txHash: makeSyntheticTxHash(),
  },
  {
    id: "earn-alfama-2026-07-06",
    userId: USER.id,
    propertyId: "prop-alfama-terrace-flat",
    weekOf: WEEKS[1],
    amountUsd: PAYOUT_ALFAMA,
    tonAmount: TON_ALFAMA,
    shareRatio: 0.075,
    status: "paid",
    txHash: makeSyntheticTxHash(),
  },
  {
    id: "earn-bayside-2026-07-13",
    userId: USER.id,
    propertyId: "prop-bayside-marina-penthouse",
    weekOf: WEEKS[2],
    amountUsd: PAYOUT_BAYSIDE,
    tonAmount: TON_BAYSIDE,
    shareRatio: 0.075,
    status: "paid",
    txHash: makeSyntheticTxHash(),
  },
  {
    id: "earn-alfama-2026-07-13",
    userId: USER.id,
    propertyId: "prop-alfama-terrace-flat",
    weekOf: WEEKS[2],
    amountUsd: PAYOUT_ALFAMA,
    tonAmount: TON_ALFAMA,
    shareRatio: 0.075,
    status: "paid",
    txHash: makeSyntheticTxHash(),
  },
  {
    id: "earn-bayside-2026-07-20",
    userId: USER.id,
    propertyId: "prop-bayside-marina-penthouse",
    weekOf: WEEKS[3],
    amountUsd: PAYOUT_BAYSIDE,
    tonAmount: TON_BAYSIDE,
    shareRatio: 0.075,
    status: "pending",
  },
  {
    id: "earn-alfama-2026-07-20",
    userId: USER.id,
    propertyId: "prop-alfama-terrace-flat",
    weekOf: WEEKS[3],
    amountUsd: PAYOUT_ALFAMA,
    tonAmount: TON_ALFAMA,
    shareRatio: 0.075,
    status: "pending",
  },
];

// One RentalDistribution per owned property per seeded week (8 total).
const DISTRIBUTIONS: RentalDistribution[] = [
  {
    id: "dist-bayside-2026-06-29",
    propertyId: "prop-bayside-marina-penthouse",
    weekOf: WEEKS[0],
    rentPoolUsd: 20000,
    rentPoolNanoTon: 20000 * NANO_PER_USD_MINOR,
    payoutDay: "2026-07-02T00:00:00Z",
    status: "completed",
    totalShares: 800,
    createdAt: WEEKS[0],
  },
  {
    id: "dist-alfama-2026-06-29",
    propertyId: "prop-alfama-terrace-flat",
    weekOf: WEEKS[0],
    rentPoolUsd: 25000,
    rentPoolNanoTon: 25000 * NANO_PER_USD_MINOR,
    payoutDay: "2026-07-02T00:00:00Z",
    status: "completed",
    totalShares: 1000,
    createdAt: WEEKS[0],
  },
  {
    id: "dist-bayside-2026-07-06",
    propertyId: "prop-bayside-marina-penthouse",
    weekOf: WEEKS[1],
    rentPoolUsd: 20000,
    rentPoolNanoTon: 20000 * NANO_PER_USD_MINOR,
    payoutDay: "2026-07-09T00:00:00Z",
    status: "completed",
    totalShares: 800,
    createdAt: WEEKS[1],
  },
  {
    id: "dist-alfama-2026-07-06",
    propertyId: "prop-alfama-terrace-flat",
    weekOf: WEEKS[1],
    rentPoolUsd: 25000,
    rentPoolNanoTon: 25000 * NANO_PER_USD_MINOR,
    payoutDay: "2026-07-09T00:00:00Z",
    status: "completed",
    totalShares: 1000,
    createdAt: WEEKS[1],
  },
  {
    id: "dist-bayside-2026-07-13",
    propertyId: "prop-bayside-marina-penthouse",
    weekOf: WEEKS[2],
    rentPoolUsd: 20000,
    rentPoolNanoTon: 20000 * NANO_PER_USD_MINOR,
    payoutDay: "2026-07-16T00:00:00Z",
    status: "completed",
    totalShares: 800,
    createdAt: WEEKS[2],
  },
  {
    id: "dist-alfama-2026-07-13",
    propertyId: "prop-alfama-terrace-flat",
    weekOf: WEEKS[2],
    rentPoolUsd: 25000,
    rentPoolNanoTon: 25000 * NANO_PER_USD_MINOR,
    payoutDay: "2026-07-16T00:00:00Z",
    status: "completed",
    totalShares: 1000,
    createdAt: WEEKS[2],
  },
  {
    id: "dist-bayside-2026-07-20",
    propertyId: "prop-bayside-marina-penthouse",
    weekOf: WEEKS[3],
    rentPoolUsd: 20000,
    rentPoolNanoTon: 20000 * NANO_PER_USD_MINOR,
    payoutDay: "2026-07-23T00:00:00Z",
    status: "distributing",
    totalShares: 800,
    createdAt: WEEKS[3],
  },
  {
    id: "dist-alfama-2026-07-20",
    propertyId: "prop-alfama-terrace-flat",
    weekOf: WEEKS[3],
    rentPoolUsd: 25000,
    rentPoolNanoTon: 25000 * NANO_PER_USD_MINOR,
    payoutDay: "2026-07-23T00:00:00Z",
    status: "scheduled",
    totalShares: 1000,
    createdAt: WEEKS[3],
  },
];

// Order book levels for the 2 funded + 2 resale properties (funding -> empty).
const fundedBooks: Record<string, { bids: OrderBookLevel[]; asks: OrderBookLevel[]; lastTradeUsd: number }> = {
  "prop-bayside-marina-penthouse": {
    bids: [{ priceUsd: 24500, quantity: 12, cumulative: 12 }],
    asks: [{ priceUsd: 25800, quantity: 8, cumulative: 8 }],
    lastTradeUsd: 25100,
  },
  "prop-alfama-terrace-flat": {
    bids: [{ priceUsd: 9800, quantity: 25, cumulative: 25 }],
    asks: [{ priceUsd: 10300, quantity: 15, cumulative: 15 }],
    lastTradeUsd: 10000,
  },
  "prop-tbilisi-riverhouse-loft": {
    bids: [{ priceUsd: 7600, quantity: 40, cumulative: 40 }],
    asks: [{ priceUsd: 8400, quantity: 20, cumulative: 20 }],
    lastTradeUsd: 8000,
  },
  "prop-canggu-surf-villa": {
    bids: [{ priceUsd: 19200, quantity: 30, cumulative: 30 }],
    asks: [{ priceUsd: 20800, quantity: 18, cumulative: 18 }],
    lastTradeUsd: 20000,
  },
};

const ORDER_BOOKS: OrderBookState[] = PROPERTIES.map((p) => {
  const book = fundedBooks[p.id];
  if (!book) {
    return {
      propertyId: p.id,
      bids: [],
      asks: [],
    };
  }
  return {
    propertyId: p.id,
    bids: book.bids,
    asks: book.asks,
    bestBidUsd: book.bids[0].priceUsd,
    bestAskUsd: book.asks[0].priceUsd,
    lastTradeUsd: book.lastTradeUsd,
  };
});

// >=1 open order on a resale property.
const OPEN_ORDERS: Order[] = [
  {
    id: "ord-aria-canggu-sell-1",
    propertyId: "prop-canggu-surf-villa",
    makerAddress: USER.walletAddress ?? "",
    side: "sell",
    priceUsd: 20500,
    quantity: 5,
    filledQuantity: 0,
    status: "open",
    createdAt: "2026-07-18T16:30:00Z",
  },
];

// >=1 success + >=1 pending + >=1 failed.
const TRANSACTIONS: Transaction[] = [
  {
    id: "tx-bayside-buy-success",
    kind: "buy",
    propertyId: "prop-bayside-marina-penthouse",
    userId: USER.id,
    shares: 60,
    amountUsd: 60 * 25000,
    status: "success",
    txHash: makeSyntheticTxHash(),
    createdAt: "2026-03-05T09:42:00Z",
  },
  {
    id: "tx-alfama-buy-success",
    kind: "buy",
    propertyId: "prop-alfama-terrace-flat",
    userId: USER.id,
    shares: 75,
    amountUsd: 75 * 10000,
    status: "success",
    txHash: makeSyntheticTxHash(),
    createdAt: "2026-04-19T12:10:00Z",
  },
  {
    id: "tx-marina-buy-pending",
    kind: "buy",
    propertyId: "prop-marina-vista-4b",
    userId: USER.id,
    shares: 10,
    amountUsd: 10 * 12500,
    status: "pending",
    txHash: makeSyntheticTxHash(),
    createdAt: "2026-07-22T18:05:00Z",
  },
  {
    id: "tx-tbilisi-buy-failed",
    kind: "buy",
    propertyId: "prop-tbilisi-riverhouse-loft",
    userId: USER.id,
    shares: 4,
    amountUsd: 4 * 8000,
    status: "failed",
    error: "wallet rejected the buy transaction",
    createdAt: "2026-07-15T10:20:00Z",
  },
];

export interface Seed {
  user: UserProfile;
  properties: Listing[];
  holdings: Holding[];
  earnings: EarningsEntry[];
  distributions: RentalDistribution[];
  openOrders: Order[];
  orderBooks: OrderBookState[];
  transactions: Transaction[];
}

export const seed: Seed = Object.freeze({
  user: USER,
  properties: PROPERTIES,
  holdings: HOLDINGS,
  earnings: EARNINGS_ENTRIES,
  distributions: DISTRIBUTIONS,
  openOrders: OPEN_ORDERS,
  orderBooks: ORDER_BOOKS,
  transactions: TRANSACTIONS,
});

export const seedPortfolioSummary = (): PortfolioSummary => {
  const totalInvestedUsd = HOLDINGS.reduce((s, h) => s + h.sharesOwned * h.avgCostUsd, 0);
  const totalValueUsd = HOLDINGS.reduce((s, h) => s + h.currentValueUsd, 0);
  const totalEarningsUsd = EARNINGS_ENTRIES.filter((e) => e.status === "paid").reduce(
    (s, e) => s + e.amountUsd,
    0,
  );
  const weeklyProjectedUsd = EARNINGS_ENTRIES.filter((e) => e.status === "pending").reduce(
    (s, e) => s + e.amountUsd,
    0,
  );
  return {
    totalValueUsd,
    totalInvestedUsd,
    totalEarningsUsd,
    weeklyProjectedUsd,
    holdings: [...HOLDINGS],
    openOrders: [...OPEN_ORDERS],
  };
};

export const seedEarningsSummary = (): EarningsSummary => {
  const paid = EARNINGS_ENTRIES.filter((e) => e.status === "paid");
  const pending = EARNINGS_ENTRIES.filter((e) => e.status === "pending");
  const allTimeUsd = paid.reduce((s, e) => s + e.amountUsd, 0);
  const thisWeekProjectedUsd = pending.reduce((s, e) => s + e.amountUsd, 0);
  return {
    allTimeUsd,
    thisWeekProjectedUsd,
    projectedNextWeekUsd: thisWeekProjectedUsd,
    entries: [...EARNINGS_ENTRIES].sort((a, b) => b.weekOf.localeCompare(a.weekOf)),
  };
};
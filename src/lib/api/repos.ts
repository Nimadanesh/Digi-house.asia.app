// File responsibility: repository CONTRACTS. The mock implements these; the real TON/backend swaps in by
// changing lib/api/getRepo.ts. Hooks depend on these interfaces - never on the mock impl.
import type { Listing, PropertyStatus } from "@/types/property";
import type { OrderBookState, Order, OrderSide, Trade } from "@/types/order";
import type { PortfolioSummary } from "@/types/position";
import type { EarningsSummary } from "@/types/earnings";
import type { Transaction } from "@/types/transaction";
import type { DocumentMeta, DocumentDownloadUrl } from "@/types/property-document";
import type { BuyPrepareResult, BuyConfirmResult, BuyVerifyResult, BuyCurrency } from "@/types/buy";
import type { MeSummary, PayoutPeriod, ShareLock, UnlockRequestResult } from "@/types/lock";
import type { FeeTier } from "@/types/fees";
import type { InstantSellResult } from "@/types/sell";
import type { Withdrawal } from "@/types/withdrawal";

export interface MarketplaceRepo {
  list(filter?: { status?: PropertyStatus; query?: string }): Promise<Listing[]>;
  get(propertyId: string): Promise<Listing>;
}

export interface OrderBookRepo {
  get(propertyId: string): Promise<OrderBookState>;
  placeOrder(input: { propertyId: string; side: OrderSide; priceUsd: number; quantity: number }): Promise<Order>;
  cancelOrder(orderId: string): Promise<void>;
  /** Recent executed fills (PD-04), newest first. */
  trades(propertyId: string): Promise<Trade[]>;
}

export interface PortfolioRepo {
  summary(): Promise<PortfolioSummary>;
  exportCsv(): Promise<string>;
}

export interface EarningsRepo {
  summary(): Promise<EarningsSummary>;
  tickPayout(): Promise<{ distributionId: string; paidEntries: number }>;
}

export interface TxRepo {
  /**
   * Create a buy intent and return the TonConnect message (destination + amount, plus the
   * jetton_transfer payload for USDT) that pays for the shares. No shares/holdings are changed —
   * settlement happens after on-chain verification.
   */
  prepareBuy(input: { propertyId: string; quantity: number; priceUsdPerShare: number; currency?: BuyCurrency }): Promise<BuyPrepareResult>;
  /** Record the user's on-chain payment against the intent. Does not settle shares. */
  confirmBuy(input: { intentId: string; txHash?: string; boc?: string | null }): Promise<BuyConfirmResult>;
  /**
   * Poll the backend for on-chain verification + settlement of a confirmed buy. The backend only
   * settles after the payment is verified against TonAPI; this returns pending_confirmation until
   * it is, verification_failed (final) on a hard mismatch, or settled.
   */
  verifyAndSettle(intentId: string): Promise<BuyVerifyResult>;
  listTransactions(opts?: { limit?: number; offset?: number }): Promise<{ transactions: Transaction[]; hasMore: boolean }>;
}

export type DocumentsRepo = {
  list(propertyId: string): Promise<DocumentMeta[]>;
  getDownloadUrl(propertyId: string, docId: string): Promise<DocumentDownloadUrl>;
};

/** Share locks — lock shares to earn yield, request unlock to sell (PRODUCT-PLAN §0.4). */
export interface LocksRepo {
  list(): Promise<{ locks: ShareLock[] }>;
  create(input: {
    propertyId: string;
    shares: number;
    payoutPeriod: PayoutPeriod;
  }): Promise<ShareLock>;
  requestUnlock(lockId: string): Promise<UnlockRequestResult>;
}

/** Home dashboard summary — dual balances + locked/free shares + yield figures. */
export interface MeRepo {
  summary(): Promise<MeSummary>;
}

/** Platform commission schedule (PRODUCT-PLAN §0.5). */
export interface FeesRepo {
  list(): Promise<FeeTier[]>;
}

/** Instant sells — platform buy-back during the primary offering (§0.3). */
export interface SellsRepo {
  instant(input: {
    propertyId: string;
    shares: number;
  }): Promise<InstantSellResult>;
}

/** USDT withdrawals (PE-02) — request a payout from the withdrawable balance. */
export interface WithdrawalsRepo {
  list(): Promise<Withdrawal[]>;
  request(input: { amountUsd: number }): Promise<Withdrawal>;
}

export interface Repos {
  marketplace: MarketplaceRepo;
  orderBook: OrderBookRepo;
  portfolio: PortfolioRepo;
  earnings: EarningsRepo;
  tx: TxRepo;
  documents: DocumentsRepo;
  locks: LocksRepo;
  me: MeRepo;
  fees: FeesRepo;
  sells: SellsRepo;
  withdrawals: WithdrawalsRepo;
}
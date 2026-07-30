// File responsibility: repository CONTRACTS. The mock implements these; the real TON/backend swaps in by
// changing lib/api/getRepo.ts. Hooks depend on these interfaces - never on the mock impl.
import type { Listing, PropertyStatus } from "@/types/property";
import type { OrderBookState, Order, OrderSide } from "@/types/order";
import type { PortfolioSummary } from "@/types/position";
import type { EarningsSummary } from "@/types/earnings";
import type { Transaction } from "@/types/transaction";
import type { DocumentMeta, DocumentDownloadUrl } from "@/types/property-document";

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
  exportCsv(): Promise<string>;
}

export interface EarningsRepo {
  summary(): Promise<EarningsSummary>;
  tickPayout(): Promise<{ distributionId: string; paidEntries: number }>;
}

export interface TxRepo {
  buy(input: { propertyId: string; quantity: number; priceUsdPerShare: number }): Promise<Transaction>;
  listTransactions(opts?: { limit?: number; offset?: number }): Promise<{ transactions: Transaction[]; hasMore: boolean }>;
}

export type DocumentsRepo = {
  list(propertyId: string): Promise<DocumentMeta[]>;
  getDownloadUrl(propertyId: string, docId: string): Promise<DocumentDownloadUrl>;
};

export interface Repos {
  marketplace: MarketplaceRepo;
  orderBook: OrderBookRepo;
  portfolio: PortfolioRepo;
  earnings: EarningsRepo;
  tx: TxRepo;
  documents: DocumentsRepo;
}
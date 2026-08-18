// File responsibility: HTTP implementations of all repo interfaces, created by createHttpRepos.
import type {
  MarketplaceRepo,
  OrderBookRepo,
  PortfolioRepo,
  EarningsRepo,
  TxRepo,
  Repos,
  DocumentsRepo,
  LocksRepo,
  MeRepo,
  FeesRepo,
  SellsRepo,
  WithdrawalsRepo,
} from "@/lib/api/repos";
import type { HttpClient } from "@/lib/api/http/client";
import type { DocumentMeta, DocumentDownloadUrl } from "@/types/property-document";
import type { Transaction } from "@/types/transaction";
import type { Trade } from "@/types/order";
import type { BuyConfirmResult, BuyPrepareResult, BuyVerifyResult, BuyCurrency } from "@/types/buy";
import type { MeSummary, ShareLock, UnlockRequestResult } from "@/types/lock";
import type { FeeTier } from "@/types/fees";
import type { InstantSellResult } from "@/types/sell";
import type { Withdrawal } from "@/types/withdrawal";

interface BuyPrepareResponse {
  intentId: string;
  propertyId: string;
  quantity: number;
  priceUsdPerShare: number;
  totalUsd: number;
  currency?: string;
  tonConnectMessages: Array<{ address: string; amount: string; payload?: string | null }>;
  expiresAt: string;
}

export function createHttpRepos(client: HttpClient): Repos {
  const marketplace: MarketplaceRepo = {
    async list(filter) {
      return client.get("/v1/marketplace", {
        status: filter?.status,
        query: filter?.query,
      });
    },
    async get(propertyId: string) {
      return client.get(`/v1/properties/${encodeURIComponent(propertyId)}`);
    },
  };

  const orderBook: OrderBookRepo = {
    async get(propertyId: string) {
      return client.get(`/v1/properties/${encodeURIComponent(propertyId)}/order-book`);
    },
    async placeOrder(input) {
      return client.post("/v1/orders", input);
    },
    async cancelOrder(orderId: string) {
      return client.delete(`/v1/orders/${encodeURIComponent(orderId)}`);
    },
    async trades(propertyId: string) {
      const body = await client.get<{ trades: Trade[] }>(
        `/v1/properties/${encodeURIComponent(propertyId)}/trades`,
      );
      return body.trades;
    },
  };

  const portfolio: PortfolioRepo = {
    async summary() {
      return client.get("/v1/portfolio");
    },
    async exportCsv() {
      return client.getText("/v1/portfolio/export.csv");
    },
  };

  const earnings: EarningsRepo = {
    async summary() {
      return client.get("/v1/earnings");
    },
    async tickPayout() {
      // Server-side worker owns tick payouts when DATA_SOURCE=api (ADR-001).
      return { distributionId: "api", paidEntries: 0 };
    },
  };

  const tx: TxRepo = {
    async prepareBuy(input): Promise<BuyPrepareResult> {
      const prep = await client.post<BuyPrepareResponse>("/v1/buys/prepare", {
        propertyId: input.propertyId,
        quantity: input.quantity,
        priceUsdPerShare: input.priceUsdPerShare,
        currency: input.currency ?? "TON",
      });
      const msg = prep.tonConnectMessages[0];
      if (!msg?.address || !msg.amount) {
        throw new Error(
          "prepare returned no payment message — admin wallet not configured",
        );
      }
      return {
        intentId: prep.intentId,
        propertyId: prep.propertyId,
        quantity: prep.quantity,
        priceUsdPerShare: prep.priceUsdPerShare,
        totalUsd: prep.totalUsd,
        currency: (prep.currency === "USDT" ? "USDT" : "TON") as BuyCurrency,
        message: { address: msg.address, amount: msg.amount, payload: msg.payload ?? null },
        expiresAt: prep.expiresAt,
      };
    },
    async confirmBuy(input): Promise<BuyConfirmResult> {
      return client.post<BuyConfirmResult>("/v1/buys/confirm", {
        intentId: input.intentId,
        boc: input.boc ?? null,
        ...(input.txHash ? { txHash: input.txHash } : {}),
      });
    },
    async verifyAndSettle(intentId: string): Promise<BuyVerifyResult> {
      return client.post<BuyVerifyResult>("/v1/buys/verify-and-settle", { intentId });
    },
    async listTransactions(opts) {
      return client.get<{ transactions: Transaction[]; hasMore: boolean }>("/v1/transactions", {
        limit: String(opts?.limit ?? 50),
        offset: String(opts?.offset ?? 0),
      });
    },
  };

  const documents: DocumentsRepo = {
    async list(propertyId) {
      return client.get<{ documents: DocumentMeta[] }>(
        `/v1/properties/${encodeURIComponent(propertyId)}/documents`,
      ).then((r) => r.documents);
    },
    async getDownloadUrl(propertyId, docId) {
      return client.get<DocumentDownloadUrl>(
        `/v1/properties/${encodeURIComponent(propertyId)}/documents/${encodeURIComponent(docId)}/url`,
      );
    },
  };

  const locks: LocksRepo = {
    async list() {
      return client.get<{ locks: ShareLock[] }>("/v1/locks");
    },
    async create(input) {
      return client.post<ShareLock>("/v1/locks", input);
    },
    async requestUnlock(lockId: string) {
      return client.post<UnlockRequestResult>(
        `/v1/locks/${encodeURIComponent(lockId)}/unlock-request`,
      );
    },
  };

  const me: MeRepo = {
    async summary(): Promise<MeSummary> {
      return client.get("/v1/me/summary");
    },
  };

  const sells: SellsRepo = {
    async instant(input): Promise<InstantSellResult> {
      return client.post("/v1/sells/instant", input);
    },
  };

  const withdrawals: WithdrawalsRepo = {
    async list() {
      const body = await client.get<{ withdrawals: Withdrawal[] }>(
        "/v1/withdrawals",
      );
      return body.withdrawals;
    },
    async request(input) {
      return client.post<Withdrawal>("/v1/withdrawals", input);
    },
  };

  const fees: FeesRepo = {
    async list() {
      const body = await client.get<{ tiers: FeeTier[] }>("/v1/fees");
      return body.tiers;
    },
  };

  return { marketplace, orderBook, portfolio, earnings, tx, documents, locks, me, fees, sells, withdrawals };
}

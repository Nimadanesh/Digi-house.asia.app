// File responsibility: HTTP implementations of all repo interfaces, created by createHttpRepos.
import type {
  MarketplaceRepo,
  OrderBookRepo,
  PortfolioRepo,
  EarningsRepo,
  TxRepo,
  Repos,
  DocumentsRepo,
} from "@/lib/api/repos";
import type { HttpClient } from "@/lib/api/http/client";
import type { DocumentMeta, DocumentDownloadUrl } from "@/types/property-document";
import type { Transaction } from "@/types/transaction";
import type { BuyConfirmResult, BuyPrepareResult, BuyVerifyResult, BuyCurrency } from "@/types/buy";

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

  return { marketplace, orderBook, portfolio, earnings, tx, documents };
}

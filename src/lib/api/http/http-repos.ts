// File responsibility: HTTP implementations of all repo interfaces, created by createHttpRepos.
import type {
  MarketplaceRepo,
  OrderBookRepo,
  PortfolioRepo,
  EarningsRepo,
  TxRepo,
  Repos,
} from "@/lib/api/repos";
import type { HttpClient } from "@/lib/api/http/client";

interface BuyPrepareResponse {
  intentId: string;
  propertyId: string;
  quantity: number;
  priceUsdPerShare: number;
  totalUsd: number;
  expiresAt: string;
}

interface BuyConfirmResponse {
  transaction: import("@/types/transaction").Transaction;
  holding: import("@/types/position").Holding;
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
    async buy(input) {
      const prep = await client.post<BuyPrepareResponse>("/v1/buys/prepare", {
        propertyId: input.propertyId,
        quantity: input.quantity,
        priceUsdPerShare: input.priceUsdPerShare,
      });
      const conf = await client.post<BuyConfirmResponse>("/v1/buys/confirm", {
        intentId: prep.intentId,
        boc: null,
      });
      return conf.transaction;
    },
  };

  return { marketplace, orderBook, portfolio, earnings, tx };
}

// File responsibility: unit tests for HttpRepos, using mock fetch.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHttpRepos } from "./http-repos";
import type { HttpClient } from "./client";

function mockClient(): HttpClient {
  return {
    get: vi.fn() as HttpClient["get"],
    post: vi.fn() as HttpClient["post"],
    delete: vi.fn() as HttpClient["delete"],
    getText: vi.fn() as HttpClient["getText"],
  };
}

describe("createHttpRepos", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("marketplace.list hits GET /v1/marketplace", async () => {
    const client = mockClient();
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const repos = createHttpRepos(client);

    await repos.marketplace.list({ status: "funding", query: "dubai" });

    expect(client.get).toHaveBeenCalledWith("/v1/marketplace", {
      status: "funding",
      query: "dubai",
    });
  });

  it("marketplace.list without filter still passes no query", async () => {
    const client = mockClient();
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const repos = createHttpRepos(client);

    await repos.marketplace.list();

    expect(client.get).toHaveBeenCalledWith("/v1/marketplace", {
      status: undefined,
      query: undefined,
    });
  });

  it("marketplace.get hits GET /v1/properties/:id", async () => {
    const client = mockClient();
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "prop_1" });
    const repos = createHttpRepos(client);

    const result = await repos.marketplace.get("prop_1");

    expect(client.get).toHaveBeenCalledWith("/v1/properties/prop_1");
    expect(result).toEqual({ id: "prop_1" });
  });

  it("marketplace.get encodes property ID", async () => {
    const client = mockClient();
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const repos = createHttpRepos(client);

    await repos.marketplace.get("prop/1");

    expect(client.get).toHaveBeenCalledWith("/v1/properties/prop%2F1");
  });

  it("orderBook.get hits GET /v1/properties/:id/order-book", async () => {
    const client = mockClient();
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ propertyId: "prop_1", bids: [], asks: [] });
    const repos = createHttpRepos(client);

    const result = await repos.orderBook.get("prop_1");

    expect(client.get).toHaveBeenCalledWith("/v1/properties/prop_1/order-book");
    expect(result.propertyId).toBe("prop_1");
  });

  it("orderBook.placeOrder calls POST /v1/orders", async () => {
    const client = mockClient();
    (client.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "ord_1" });
    const repos = createHttpRepos(client);

    const result = await repos.orderBook.placeOrder({
      propertyId: "prop_1",
      side: "sell",
      priceUsd: 5100,
      quantity: 3,
    });

    expect(client.post).toHaveBeenCalledWith("/v1/orders", {
      propertyId: "prop_1",
      side: "sell",
      priceUsd: 5100,
      quantity: 3,
    });
    expect(result.id).toBe("ord_1");
  });

  it("orderBook.cancelOrder calls DELETE /v1/orders/:id", async () => {
    const client = mockClient();
    (client.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const repos = createHttpRepos(client);

    await repos.orderBook.cancelOrder("ord_1");

    expect(client.delete).toHaveBeenCalledWith("/v1/orders/ord_1");
  });

  it("portfolio.summary calls GET /v1/portfolio", async () => {
    const client = mockClient();
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ totalValueUsd: 25000 });
    const repos = createHttpRepos(client);

    const result = await repos.portfolio.summary();

    expect(client.get).toHaveBeenCalledWith("/v1/portfolio");
    expect(result.totalValueUsd).toBe(25000);
  });

  it("earnings.summary calls GET /v1/earnings", async () => {
    const client = mockClient();
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ allTimeUsd: 1200, entries: [] });
    const repos = createHttpRepos(client);

    const result = await repos.earnings.summary();

    expect(client.get).toHaveBeenCalledWith("/v1/earnings");
    expect(result.allTimeUsd).toBe(1200);
  });

  it("earnings.tickPayout returns no-op when api", async () => {
    const client = mockClient();
    const repos = createHttpRepos(client);

    const result = await repos.earnings.tickPayout();

    expect(result).toEqual({ distributionId: "api", paidEntries: 0 });
    expect(client.get).not.toHaveBeenCalled();
    expect(client.post).not.toHaveBeenCalled();
  });

  it("tx.buy calls prepare then confirm and returns transaction", async () => {
    const prepResponse = {
      intentId: "intent_1",
      propertyId: "prop_1",
      quantity: 5,
      priceUsdPerShare: 5000,
      totalUsd: 25000,
      expiresAt: "2026-07-29T12:15:00.000Z",
    };
    const confirmResponse = {
      transaction: {
        id: "tx_1",
        kind: "buy" as const,
        propertyId: "prop_1",
        userId: "user_1",
        shares: 5,
        amountUsd: 25000,
        status: "success" as const,
        txHash: "simulated:buy-01HZX",
        createdAt: "2026-07-29T12:01:00.000Z",
      },
      holding: {
        propertyId: "prop_1",
        sharesOwned: 5,
        avgCostUsd: 5000,
        currentValueUsd: 25000,
        pendingWeekEarningsUsd: 50,
        shareRatio: 0.0005,
      },
    };

    const client = mockClient();
    (client.post as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(prepResponse)
      .mockResolvedValueOnce(confirmResponse);
    const repos = createHttpRepos(client);

    const result = await repos.tx.buy({
      propertyId: "prop_1",
      quantity: 5,
      priceUsdPerShare: 5000,
    });

    expect(client.post).toHaveBeenCalledTimes(2);
    expect(client.post).toHaveBeenNthCalledWith(1, "/v1/buys/prepare", {
      propertyId: "prop_1",
      quantity: 5,
      priceUsdPerShare: 5000,
    });
    expect(client.post).toHaveBeenNthCalledWith(2, "/v1/buys/confirm", {
      intentId: "intent_1",
      boc: null,
    });
    expect(result).toEqual(confirmResponse.transaction);
  });
});

// File responsibility: unit tests for HttpRepos, using mock fetch.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHttpRepos } from "./http-repos";
import type { HttpClient } from "./client";

function mockClient(): HttpClient {
  return {
    get: vi.fn() as HttpClient["get"],
    post: vi.fn() as HttpClient["post"],
    patch: vi.fn() as HttpClient["patch"],
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
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "test-1" });
    const repos = createHttpRepos(client);

    const result = await repos.marketplace.get("test-1");

    expect(client.get).toHaveBeenCalledWith("/v1/properties/test-1");
    expect(result).toEqual({ id: "test-1" });
  });

  it("marketplace.get encodes property ID", async () => {
    const client = mockClient();
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const repos = createHttpRepos(client);

    await repos.marketplace.get("test/1");

    expect(client.get).toHaveBeenCalledWith("/v1/properties/test%2F1");
  });

  it("orderBook.get hits GET /v1/properties/:id/order-book", async () => {
    const client = mockClient();
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ propertyId: "test-1", bids: [], asks: [] });
    const repos = createHttpRepos(client);

    const result = await repos.orderBook.get("test-1");

    expect(client.get).toHaveBeenCalledWith("/v1/properties/test-1/order-book");
    expect(result.propertyId).toBe("test-1");
  });

  it("orderBook.placeOrder calls POST /v1/orders", async () => {
    const client = mockClient();
    (client.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "ord_1" });
    const repos = createHttpRepos(client);

    const result = await repos.orderBook.placeOrder({
      propertyId: "test-1",
      side: "sell",
      priceUsd: 5100,
      quantity: 3,
    });

    expect(client.post).toHaveBeenCalledWith("/v1/orders", {
      propertyId: "test-1",
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

  it("tx.prepareBuy maps tonConnectMessages into the TON message + currency", async () => {
    const prepResponse = {
      intentId: "intent_1",
      propertyId: "test-1",
      quantity: 5,
      priceUsdPerShare: 5000,
      totalUsd: 25000,
      currency: "TON",
      tonConnectMessages: [
        { address: "EQD-admin-wallet", amount: "125000000000", payload: null },
      ],
      expiresAt: "2026-07-29T12:15:00.000Z",
    };

    const client = mockClient();
    (client.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(prepResponse);
    const repos = createHttpRepos(client);

    const result = await repos.tx.prepareBuy({
      propertyId: "test-1",
      quantity: 5,
      priceUsdPerShare: 5000,
      currency: "TON",
    });

    expect(client.post).toHaveBeenCalledWith("/v1/buys/prepare", {
      propertyId: "test-1",
      quantity: 5,
      priceUsdPerShare: 5000,
      currency: "TON",
    });
    expect(result).toEqual({
      intentId: "intent_1",
      propertyId: "test-1",
      quantity: 5,
      priceUsdPerShare: 5000,
      totalUsd: 25000,
      currency: "TON",
      message: { address: "EQD-admin-wallet", amount: "125000000000", payload: null },
      expiresAt: "2026-07-29T12:15:00.000Z",
    });
  });

  it("tx.prepareBuy defaults the payload-less message to TON when currency is absent", async () => {
    const prepResponse = {
      intentId: "intent_1",
      propertyId: "test-1",
      quantity: 5,
      priceUsdPerShare: 5000,
      totalUsd: 25000,
      tonConnectMessages: [{ address: "EQD-admin-wallet", amount: "125000000000" }],
      expiresAt: "2026-07-29T12:15:00.000Z",
    };

    const client = mockClient();
    (client.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(prepResponse);
    const repos = createHttpRepos(client);

    const result = await repos.tx.prepareBuy({
      propertyId: "test-1",
      quantity: 5,
      priceUsdPerShare: 5000,
    });

    expect(client.post).toHaveBeenCalledWith("/v1/buys/prepare", {
      propertyId: "test-1",
      quantity: 5,
      priceUsdPerShare: 5000,
      currency: "TON",
    });
    expect(result.currency).toBe("TON");
    expect(result.message).toEqual({ address: "EQD-admin-wallet", amount: "125000000000", payload: null });
  });

  it("tx.prepareBuy keeps the jetton_transfer payload for USDT", async () => {
    const prepResponse = {
      intentId: "intent_usdt",
      propertyId: "test-1",
      quantity: 5,
      priceUsdPerShare: 5000,
      totalUsd: 25000,
      currency: "USDT",
      tonConnectMessages: [
        { address: "EQD-user-jetton-wallet", amount: "100000000", payload: "te6ccgEBAQEA..." },
      ],
      expiresAt: "2026-07-29T12:15:00.000Z",
    };

    const client = mockClient();
    (client.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(prepResponse);
    const repos = createHttpRepos(client);

    const result = await repos.tx.prepareBuy({
      propertyId: "test-1",
      quantity: 5,
      priceUsdPerShare: 5000,
      currency: "USDT",
    });

    expect(client.post).toHaveBeenCalledWith("/v1/buys/prepare", {
      propertyId: "test-1",
      quantity: 5,
      priceUsdPerShare: 5000,
      currency: "USDT",
    });
    expect(result.currency).toBe("USDT");
    expect(result.message).toEqual({
      address: "EQD-user-jetton-wallet",
      amount: "100000000",
      payload: "te6ccgEBAQEA...",
    });
  });

  it("tx.prepareBuy throws when prepare returns no payment message", async () => {
    const prepResponse = {
      intentId: "intent_1",
      propertyId: "test-1",
      quantity: 5,
      priceUsdPerShare: 5000,
      totalUsd: 25000,
      tonConnectMessages: [],
      expiresAt: "2026-07-29T12:15:00.000Z",
    };
    const client = mockClient();
    (client.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(prepResponse);
    const repos = createHttpRepos(client);

    await expect(
      repos.tx.prepareBuy({ propertyId: "test-1", quantity: 5, priceUsdPerShare: 5000 }),
    ).rejects.toThrow(/payment message/i);
  });

  it("tx.confirmBuy posts intentId + txHash + boc to /v1/buys/confirm", async () => {
    const confirmResponse = {
      intentId: "intent_1",
      status: "confirmed",
      message: "Payment recorded. Share settlement follows on-chain verification.",
    };
    const client = mockClient();
    (client.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(confirmResponse);
    const repos = createHttpRepos(client);

    const result = await repos.tx.confirmBuy({
      intentId: "intent_1",
      txHash: "cafebabedeadbeef",
      boc: "boc:0001",
    });

    expect(client.post).toHaveBeenCalledWith("/v1/buys/confirm", {
      intentId: "intent_1",
      txHash: "cafebabedeadbeef",
      boc: "boc:0001",
    });
    expect(result).toEqual(confirmResponse);
  });

  it("tx.confirmBuy omits txHash when not provided", async () => {
    const client = mockClient();
    (client.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      intentId: "intent_1",
      status: "confirmed",
    });
    const repos = createHttpRepos(client);

    await repos.tx.confirmBuy({ intentId: "intent_1" });

    expect(client.post).toHaveBeenCalledWith("/v1/buys/confirm", {
      intentId: "intent_1",
      boc: null,
    });
  });

  it("tx.verifyAndSettle posts intentId to /v1/buys/verify-and-settle", async () => {
    const verifyResponse = {
      intentId: "intent_1",
      status: "settled" as const,
      txHash: "cafebabedeadbeef",
      actualAmountNano: "125000000000",
    };
    const client = mockClient();
    (client.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(verifyResponse);
    const repos = createHttpRepos(client);

    const result = await repos.tx.verifyAndSettle("intent_1");

    expect(client.post).toHaveBeenCalledWith("/v1/buys/verify-and-settle", {
      intentId: "intent_1",
    });
    expect(result).toEqual(verifyResponse);
  });

  it("tx.verifyAndSettle surfaces pending_confirmation verbatim", async () => {
    const client = mockClient();
    (client.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      intentId: "intent_1",
      status: "pending_confirmation",
      reason: "tx_not_found",
    });
    const repos = createHttpRepos(client);

    const result = await repos.tx.verifyAndSettle("intent_1");

    expect(result.status).toBe("pending_confirmation");
    expect(result.reason).toBe("tx_not_found");
  });
});

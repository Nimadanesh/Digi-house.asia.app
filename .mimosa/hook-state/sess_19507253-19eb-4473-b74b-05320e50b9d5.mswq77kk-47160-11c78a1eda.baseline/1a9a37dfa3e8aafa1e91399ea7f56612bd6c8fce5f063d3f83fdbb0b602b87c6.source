import { describe, expect, it, vi } from "vitest";
import { createTonApiTxClient } from "./tonapi-client.js";
import type { TonTxClient } from "./tx-client.js";

const BASE = "https://testnet.tonapi.io";
const HASH = "a".repeat(64);

function fakeFetch(status: number, body?: unknown): ReturnType<typeof fetch> {
  return vi.fn(async () => {
    if (status === 404) {
      return new Response(null, { status });
    }
    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as ReturnType<typeof fetch>;
}

describe("createTonApiTxClient", () => {
  it("returns found with the parsed transaction fields", async () => {
    const fetchImpl = fakeFetch(200, {
      hash: HASH,
      success: true,
      utime: 1_720_000_000,
      out_msgs: [
        {
          destination: { address: "0:2222222222222222222222222222222222222222222222222222222222222222" },
          value: "1000000000",
        },
      ],
    });
    const client: TonTxClient = createTonApiTxClient({ baseUrl: BASE, fetchImpl: fetchImpl as never });
    const r = await client.getTransactionByMessageHash(HASH);
    expect(r).toEqual({
      kind: "found",
      tx: {
        hash: HASH,
        success: true,
        utime: 1_720_000_000,
        outMessages: [{ destinationAddress: "0:2222222222222222222222222222222222222222222222222222222222222222", valueNano: "1000000000" }],
      },
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining(`/v2/blockchain/messages/${HASH}/transaction`),
      expect.objectContaining({ headers: expect.objectContaining({ accept: "application/json" }) }),
    );
  });

  it("sends the API key as a bearer token when configured", async () => {
    const fetchImpl = fakeFetch(200, { hash: HASH, success: true, utime: 1, out_msgs: [] });
    const client: TonTxClient = createTonApiTxClient({ baseUrl: BASE, apiKey: "secret-key", fetchImpl: fetchImpl as never });
    await client.getTransactionByMessageHash(HASH);
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ headers: expect.objectContaining({ authorization: "Bearer secret-key" }) }),
    );
  });

  it("not_found on 404", async () => {
    const client: TonTxClient = createTonApiTxClient({ baseUrl: BASE, fetchImpl: fakeFetch(404) as never });
    expect(await client.getTransactionByMessageHash(HASH)).toEqual({ kind: "not_found" });
  });

  it("error on non-2xx status", async () => {
    const client: TonTxClient = createTonApiTxClient({ baseUrl: BASE, fetchImpl: fakeFetch(500) as never });
    expect(await client.getTransactionByMessageHash(HASH)).toEqual({ kind: "error" });
  });

  it("error when the network call throws", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    const client: TonTxClient = createTonApiTxClient({ baseUrl: BASE, fetchImpl });
    expect(await client.getTransactionByMessageHash(HASH)).toEqual({ kind: "error" });
  });

  it("error when the payload is not JSON", async () => {
    const fetchImpl = vi.fn(async () => new Response("not json", { status: 200 })) as unknown as typeof fetch;
    const client: TonTxClient = createTonApiTxClient({ baseUrl: BASE, fetchImpl });
    expect(await client.getTransactionByMessageHash(HASH)).toEqual({ kind: "error" });
  });
});

describe("createTonApiTxClient.getJettonTransfer", () => {
  it("returns found with the JettonTransfer action fields", async () => {
    const fetchImpl = fakeFetch(200, {
      timestamp: 1_720_000_000,
      actions: [
        {
          type: "JettonTransfer",
          status: "ok",
          jetton: { address: "0:2222222222222222222222222222222222222222222222222222222222222222" },
          recipient: { address: "0:1111111111111111111111111111111111111111111111111111111111111111" },
          amount: "5000000000",
        },
      ],
    });
    const client: TonTxClient = createTonApiTxClient({ baseUrl: BASE, fetchImpl: fetchImpl as never });
    const r = await client.getJettonTransfer(HASH);
    expect(r).toEqual({
      kind: "found",
      transfer: {
        status: "ok",
        jettonMasterAddress: "0:2222222222222222222222222222222222222222222222222222222222222222",
        recipientAddress: "0:1111111111111111111111111111111111111111111111111111111111111111",
        amount: "5000000000",
        utime: 1_720_000_000,
      },
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining(`/v2/events/${HASH}`),
      expect.objectContaining({ headers: expect.objectContaining({ accept: "application/json" }) }),
    );
  });

  it("not_found when no JettonTransfer action is present", async () => {
    const fetchImpl = fakeFetch(200, { timestamp: 1, actions: [{ type: "TonTransfer", status: "ok" }] });
    const client: TonTxClient = createTonApiTxClient({ baseUrl: BASE, fetchImpl: fetchImpl as never });
    expect(await client.getJettonTransfer(HASH)).toEqual({ kind: "not_found" });
  });

  it("not_found on 404", async () => {
    const client: TonTxClient = createTonApiTxClient({ baseUrl: BASE, fetchImpl: fakeFetch(404) as never });
    expect(await client.getJettonTransfer(HASH)).toEqual({ kind: "not_found" });
  });

  it("maps a failed action status", async () => {
    const fetchImpl = fakeFetch(200, { timestamp: 1, actions: [{ type: "JettonTransfer", status: "failed" }] });
    const client: TonTxClient = createTonApiTxClient({ baseUrl: BASE, fetchImpl: fetchImpl as never });
    const r = await client.getJettonTransfer(HASH);
    expect(r.kind).toBe("found");
    if (r.kind === "found") expect(r.transfer.status).toBe("failed");
  });

  it("error on non-2xx status", async () => {
    const client: TonTxClient = createTonApiTxClient({ baseUrl: BASE, fetchImpl: fakeFetch(500) as never });
    expect(await client.getJettonTransfer(HASH)).toEqual({ kind: "error" });
  });
});

describe("createTonApiTxClient.getJettonWalletAddress", () => {
  it("returns found with the derived jetton wallet address", async () => {
    const fetchImpl = fakeFetch(200, {
      gas_used: 1000,
      stack: [{ type: "addr", value: "0:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }],
    });
    const client: TonTxClient = createTonApiTxClient({ baseUrl: BASE, fetchImpl: fetchImpl as never });
    const r = await client.getJettonWalletAddress("EQ-master", "UQ-owner");
    expect(r).toEqual({
      kind: "found",
      address: "0:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/v2/blockchain/accounts/EQ-master/methods/get_wallet_address"),
      expect.anything(),
    );
  });

  it("error when no addr is on the stack", async () => {
    const fetchImpl = fakeFetch(200, { gas_used: 1, stack: [] });
    const client: TonTxClient = createTonApiTxClient({ baseUrl: BASE, fetchImpl: fetchImpl as never });
    expect(await client.getJettonWalletAddress("EQ-master", "UQ-owner")).toEqual({ kind: "error" });
  });

  it("error on non-2xx status", async () => {
    const client: TonTxClient = createTonApiTxClient({ baseUrl: BASE, fetchImpl: fakeFetch(500) as never });
    expect(await client.getJettonWalletAddress("EQ-master", "UQ-owner")).toEqual({ kind: "error" });
  });
});

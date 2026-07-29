import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { createTransactionRoutes, type TransactionRouteDeps } from "./transactions.js";
import { createMemoryTxStore, type TransactionRecord } from "../buys/tx-store.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import { signSessionToken } from "../auth/session.js";

const SESSION = { secret: "test-session-secret-32-chars-min!!", ttlSeconds: 3600 };

function seedUser(id: string, displayName: string) {
  return {
    id, displayName, username: null, photoUrl: null,
    role: "investor" as const, walletAddress: null, onboarded: false,
    useTelegramTheme: false, referredByUserId: null, createdAt: new Date(), updatedAt: new Date(),
  };
}

const BASE_TXS: TransactionRecord[] = [
  {
    id: "tx-1", userId: "user-a", kind: "buy", propertyId: "prop-1",
    shares: 10, amountUsd: 100000, tonAmount: null, status: "success",
    txHash: "simulated:tx-1", error: null, buyIntentId: null, createdAt: new Date("2026-07-01"),
  },
  {
    id: "tx-2", userId: "user-a", kind: "earnings", propertyId: null,
    shares: null, amountUsd: 5000, tonAmount: null, status: "success",
    txHash: "simulated:tx-2", error: null, buyIntentId: null, createdAt: new Date("2026-07-02"),
  },
  {
    id: "tx-3", userId: "user-b", kind: "buy", propertyId: "prop-2",
    shares: 5, amountUsd: 50000, tonAmount: null, status: "success",
    txHash: "simulated:tx-3", error: null, buyIntentId: null, createdAt: new Date("2026-07-03"),
  },
  {
    id: "tx-4", userId: "user-a", kind: "sell", propertyId: "prop-1",
    shares: -5, amountUsd: -50000, tonAmount: null, status: "success",
    txHash: "simulated:tx-4", error: null, buyIntentId: null, createdAt: new Date("2026-07-04"),
  },
];

function makeDeps(over: Partial<TransactionRouteDeps> = {}): TransactionRouteDeps {
  return {
    session: SESSION,
    users: createMemoryUserStore([
      seedUser("user-a", "Alice"),
      seedUser("user-b", "Bob"),
    ]),
    transactions: createMemoryTxStore(BASE_TXS),
    ...over,
  };
}

describe("transaction routes", () => {
  describe("GET /v1/transactions", () => {
    it("returns 401 without auth", async () => {
      const app = new Hono().route("/", createTransactionRoutes(makeDeps()));
      const res = await app.request("/v1/transactions");
      expect(res.status).toBe(401);
    });

    it("returns caller's transactions only (IDOR)", async () => {
      const app = new Hono().route("/", createTransactionRoutes(makeDeps()));
      const { token } = await signSessionToken("user-a", SESSION);
      const res = await app.request("/v1/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { transactions: Array<{ id: string }>; hasMore: boolean };
      expect(body.transactions).toHaveLength(3);
      expect(body.transactions.every((t) => ["tx-1", "tx-2", "tx-4"].includes(t.id))).toBe(true);
      expect(body.hasMore).toBe(false);
    });

    it("user B cannot see user A's transactions", async () => {
      const app = new Hono().route("/", createTransactionRoutes(makeDeps()));
      const { token } = await signSessionToken("user-b", SESSION);
      const res = await app.request("/v1/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { transactions: Array<{ id: string }> };
      expect(body.transactions).toHaveLength(1);
      expect(body.transactions[0]!.id).toBe("tx-3");
    });

    it("returns empty array for user with no transactions", async () => {
      const store = createMemoryTxStore(BASE_TXS);
      const deps = makeDeps({
        transactions: store,
        users: createMemoryUserStore([
          seedUser("user-a", "Alice"),
          seedUser("user-b", "Bob"),
          seedUser("no-tx-user", "NoTx"),
        ]),
      });
      const app = new Hono().route("/", createTransactionRoutes(deps));
      const { token } = await signSessionToken("no-tx-user", SESSION);
      const res = await app.request("/v1/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { transactions: unknown[]; hasMore: boolean };
      expect(body.transactions).toEqual([]);
      expect(body.hasMore).toBe(false);
    });

    it("respects limit parameter", async () => {
      const app = new Hono().route("/", createTransactionRoutes(makeDeps()));
      const { token } = await signSessionToken("user-a", SESSION);
      const res = await app.request("/v1/transactions?limit=2", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { transactions: Array<{ id: string }>; hasMore: boolean };
      expect(body.transactions).toHaveLength(2);
      expect(body.hasMore).toBe(true);
    });

    it("respects offset parameter", async () => {
      const app = new Hono().route("/", createTransactionRoutes(makeDeps()));
      const { token } = await signSessionToken("user-a", SESSION);
      const res = await app.request("/v1/transactions?limit=2&offset=2", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { transactions: Array<{ id: string }>; hasMore: boolean };
      expect(body.transactions).toHaveLength(1);
      expect(body.hasMore).toBe(false);
    });
  });
});

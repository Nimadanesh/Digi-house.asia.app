import { Hono } from "hono";
import { requireSession } from "../auth/require-session.js";
import type { SessionConfig } from "../auth/session.js";
import type { UserStore } from "../auth/user-store.js";
import type { TxStore } from "../buys/tx-store.js";
import { mapTransactionPublic } from "../buys/tx-store.js";

export type TransactionRouteDeps = {
  session: SessionConfig;
  users: UserStore;
  transactions: TxStore;
};

export function createTransactionRoutes(deps: TransactionRouteDeps) {
  const app = new Hono();

  app.get(
    "/v1/transactions",
    requireSession({ session: deps.session, users: deps.users }),
    async (c) => {
      const userId = c.get("userId");
      const rawLimit = c.req.query("limit");
      const rawOffset = c.req.query("offset");
      const limit = Math.min(Number(rawLimit) || 50, 100);
      const offset = Math.max(Number(rawOffset) || 0, 0);

      const rows = await deps.transactions.listByUserId(userId, { limit, offset });
      const transactions = rows.map(mapTransactionPublic);
      const hasMore = rows.length === limit;

      return c.json({ transactions, hasMore });
    },
  );

  return app;
}

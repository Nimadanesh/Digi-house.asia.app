import { Hono } from "hono";
import { requireSession } from "../auth/require-session.js";
import type { SessionConfig } from "../auth/session.js";
import type { UserStore } from "../auth/user-store.js";
import type { EarningsStore } from "../earnings/earnings-store.js";
import { buildEarningsSummary } from "../earnings/map-earnings.js";

export type EarningsRouteDeps = {
  session: SessionConfig;
  users: UserStore;
  earnings: EarningsStore;
};

export function createEarningsRoutes(deps: EarningsRouteDeps) {
  const app = new Hono();

  app.get(
    "/v1/earnings",
    requireSession({ session: deps.session, users: deps.users }),
    async (c) => {
      const userId = c.get("userId");
      const rows = await deps.earnings.listEntriesByUserId(userId);
      return c.json(buildEarningsSummary(rows));
    },
  );

  return app;
}

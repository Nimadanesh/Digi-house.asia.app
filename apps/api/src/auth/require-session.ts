import { createMiddleware } from "hono/factory";
import {
  bearerTokenFromHeader,
  verifySessionToken,
  type SessionConfig,
} from "./session.js";
import type { UserPublic } from "./user-public.js";
import type { UserStore } from "./user-store.js";

export type SessionVariables = {
  userId: string;
  user: UserPublic;
};

export function requireSession(deps: {
  session: SessionConfig;
  users: UserStore;
}) {
  return createMiddleware<{ Variables: SessionVariables }>(
    async (c, next) => {
      const token = bearerTokenFromHeader(c.req.header("Authorization"));
      if (!token) {
        return c.json(
          { code: "unauthorized", message: "Authentication required" },
          401,
        );
      }
      const claims = await verifySessionToken(token, deps.session);
      if (!claims) {
        return c.json(
          { code: "unauthorized", message: "Invalid or expired session" },
          401,
        );
      }
      const user = await deps.users.findById(claims.sub);
      if (!user) {
        return c.json(
          { code: "unauthorized", message: "User not found" },
          401,
        );
      }
      c.set("userId", claims.sub);
      c.set("user", user);
      await next();
    },
  );
}

import { Hono } from "hono";
import { validateInitData } from "../auth/validate-init-data.js";
import {
  signSessionToken,
  type SessionConfig,
} from "../auth/session.js";
import { requireSession } from "../auth/require-session.js";
import type { UserStore } from "../auth/user-store.js";
import {
  slidingWindowRateLimit,
  ipKey,
} from "../lib/rate-limit.js";

export type AuthRouteDeps = {
  botToken: string;
  session: SessionConfig;
  users: UserStore;
};

export function createAuthRoutes(deps: AuthRouteDeps) {
  const app = new Hono();

  app.post(
    "/v1/auth/telegram",
    slidingWindowRateLimit({
      windowMs: 60_000,
      max: 10,
      key: ipKey,
    }),
    async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        { code: "validation_error", message: "Invalid JSON body" },
        400,
      );
    }

    const initData =
      body &&
      typeof body === "object" &&
      "initData" in body &&
      typeof (body as { initData: unknown }).initData === "string"
        ? (body as { initData: string }).initData
        : null;

    if (!initData || initData.trim() === "") {
      return c.json(
        { code: "validation_error", message: "initData is required" },
        400,
      );
    }

    if (!deps.botToken) {
      return c.json(
        { code: "misconfigured", message: "TELEGRAM_BOT_TOKEN is not configured" },
        503,
      );
    }

    const parsed = validateInitData(initData, deps.botToken);
    if (!parsed.ok) {
      const status = parsed.code === "malformed" ? 400 : 401;
      return c.json(
        {
          code: parsed.code,
          message: parsed.message,
        },
        status,
      );
    }

    const displayName =
      parsed.displayName?.trim() ||
      parsed.username ||
      "User";

    const user = await deps.users.upsertFromTelegram({
      userId: parsed.userId,
      displayName,
      username: parsed.username,
      photoUrl: parsed.photoUrl,
    });
    const { token, expiresAt } = await signSessionToken(
      user.id,
      deps.session,
    );
    return c.json({
      token,
      user,
      expiresAt: expiresAt.toISOString(),
    });
  });

  app.get(
    "/v1/me",
    requireSession({ session: deps.session, users: deps.users }),
    async (c) => {
      return c.json({ user: c.get("user") });
    },
  );

  return app;
}

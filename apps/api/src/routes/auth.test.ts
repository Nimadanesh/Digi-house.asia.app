import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import {
  buildInitDataForTests,
  FIXTURE_BOT_TOKEN,
} from "../auth/test-fixtures.js";
import type { ApiEnv } from "../env.js";
import type { Logger } from "../logger.js";

const silentLog = {
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  debug: () => {},
  trace: () => {},
  child: () => silentLog,
} as unknown as Logger;

function testEnv(over: Partial<ApiEnv> = {}): ApiEnv {
  return {
    NODE_ENV: "test",
    PORT: 8787,
    LOG_LEVEL: "silent",
    SETTLEMENT_MODE: undefined,
    DATABASE_URL: undefined,
    TELEGRAM_BOT_TOKEN: FIXTURE_BOT_TOKEN,
    SESSION_SECRET: "test-session-secret-at-least-32-chars",
    SESSION_TTL_SECONDS: 3600,
    CORS_ORIGIN: "http://localhost:3000",
    TON_RELAY_ADDRESS: undefined,
    BUY_STUB_NANOTON: "10000000",
    BUY_INTENT_TTL_SECONDS: 900,
    REDIS_URL: undefined,
    ORDER_RATE_LIMIT_MAX: 30,
    ORDER_RATE_LIMIT_WINDOW_MS: 60000,
    PAYOUT_TICK_MS: 60000,
    PAYOUT_WORKER_ENABLED: false,
    ALLOW_MANUAL_PAYOUT_TICK: false,
    PAYOUT_TICK_SECRET: undefined,
    NOTIFY_EARNINGS_PAID: false,
    TON_API_URL: "https://testnet.tonapi.io",
    TON_API_KEY: undefined,
    INDEXER_POLL_MS: 10_000,
    INDEXER_ENABLED: false,
    ADMIN_API_SECRET: undefined,
    R2_ACCOUNT_ID: undefined,
    R2_ACCESS_KEY_ID: undefined,
    R2_SECRET_ACCESS_KEY: undefined,
    R2_BUCKET: undefined,
    R2_PUBLIC_BASE_URL: undefined,
    ...over,
  };
}

function makeApp(users = createMemoryUserStore()) {
  return {
    app: createApp({ env: testEnv(), log: silentLog, users }),
    users,
  };
}

describe("POST /v1/auth/telegram + GET /v1/me", () => {
  it("returns 200 + token + user for valid initData", async () => {
    const { app } = makeApp();
    const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: Math.floor(Date.now() / 1000) - 10,
      user: {
        id: 4242,
        first_name: "Aria",
        username: "aria",
      },
    });

    const res = await app.request("/v1/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      token: string;
      user: { id: string; displayName: string; username?: string };
      expiresAt: string;
    };
    expect(body.token.length).toBeGreaterThan(20);
    expect(body.user.id).toBe("4242");
    expect(body.user.displayName).toBe("Aria");
    expect(body.user.username).toBe("aria");
    expect(body.expiresAt).toMatch(/^\d{4}-/);
  });

  it("returns 401 for invalid hash", async () => {
    const { app } = makeApp();
    const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: Math.floor(Date.now() / 1000),
      user: { id: 1, first_name: "A" },
    });

    const res = await app.request("/v1/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        initData: initData.replace(/hash=[0-9a-f]+/, "hash=deadbeef"),
      }),
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("invalid_hash");
  });

  it("returns 401 for expired initData", async () => {
    const { app } = makeApp();
    // max age default 24h — use auth_date 2 days ago
    const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: Math.floor(Date.now() / 1000) - 172_800,
      user: { id: 1, first_name: "Old" },
    });

    const res = await app.request("/v1/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData }),
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("expired");
  });

  it("returns 400 for empty initData", async () => {
    const { app } = makeApp();
    const res = await app.request("/v1/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData: "" }),
    });
    expect(res.status).toBe(400);
  });

  it("GET /v1/me without Authorization → 401", async () => {
    const { app } = makeApp();
    const res = await app.request("/v1/me");
    expect(res.status).toBe(401);
  });

  it("GET /v1/me with Bearer from auth → 200", async () => {
    const { app } = makeApp();
    const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: Math.floor(Date.now() / 1000) - 5,
      user: { id: 99, first_name: "Sam" },
    });
    const authRes = await app.request("/v1/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData }),
    });
    const { token } = (await authRes.json()) as { token: string };

    const me = await app.request("/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(me.status).toBe(200);
    const body = (await me.json()) as { user: { id: string } };
    expect(body.user.id).toBe("99");
  });

  it("second auth upserts same user and updates display name", async () => {
    const { app, users } = makeApp();
    const id = 777;

    const now = Math.floor(Date.now() / 1000);
    const first = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: now - 5,
      user: { id, first_name: "First" },
    });
    await app.request("/v1/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData: first }),
    });

    const second = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: now - 4,
      user: { id, first_name: "Second" },
    });
    const res = await app.request("/v1/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData: second }),
    });
    const body = (await res.json()) as { user: { displayName: string } };
    expect(body.user.displayName).toBe("Second");
    expect(users._rows.size).toBe(1);
  });
});

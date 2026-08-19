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
    AUTH_RATE_LIMIT_MAX: 100,
    CORS_ORIGIN: "http://localhost:3000",
    TON_RELAY_ADDRESS: undefined,
    BUY_STUB_NANOTON: "10000000",
    BUY_INTENT_TTL_SECONDS: 900,
    ADMIN_TON_WALLET_ADDRESS: undefined,
    ADMIN_USDT_WALLET_ADDRESS: undefined,
    USDT_JETTON_MASTER_ADDRESS: undefined,
    TON_USD_PRICE_CENTS: 200,
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
    LAUNCH_MODE: "open",
    ALLOWLIST_WALLETS: undefined,
    YIELD_WORKER_ENABLED: false,
    YIELD_TICK_MS: 60_000,
    UNLOCK_MATURATION_MS: 3 * 24 * 3_600_000,
    NOTIFY_YIELD: false,
    HOUSE_ACCOUNT_USER_ID: "house-account",
    OPS_CHAT_ID: undefined,
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

  it("POST /v1/me/onboarded marks user onboarded", async () => {
    const { app } = makeApp();
    const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: Math.floor(Date.now() / 1000) - 5,
      user: { id: 55, first_name: "New" },
    });
    const authRes = await app.request("/v1/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData }),
    });
    const { token, user: before } = (await authRes.json()) as {
      token: string;
      user: { onboarded: boolean };
    };
    expect(before.onboarded).toBe(false);

    const res = await app.request("/v1/me/onboarded", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { id: string; onboarded: boolean } };
    expect(body.user.id).toBe("55");
    expect(body.user.onboarded).toBe(true);
  });

  it("telegram auth issues recovery code; GET recovery-code returns it", async () => {
    const { app, users } = makeApp();
    const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: Math.floor(Date.now() / 1000) - 5,
      user: { id: 88, first_name: "Rec" },
    });
    const authRes = await app.request("/v1/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData }),
    });
    const { token, user } = (await authRes.json()) as {
      token: string;
      user: { profileCompleted: boolean; recoveryCode?: string };
    };
    expect(user.profileCompleted).toBe(false);
    expect(user.recoveryCode).toBeUndefined();
    expect(users._rows.get("88")?.recoveryCode).toMatch(/^DH-/);

    const codeRes = await app.request("/v1/me/recovery-code", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(codeRes.status).toBe(200);
    const { recoveryCode } = (await codeRes.json()) as { recoveryCode: string };
    expect(recoveryCode).toMatch(/^DH-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("PATCH /v1/me updates profile and completes", async () => {
    const { app } = makeApp();
    const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
      authDate: Math.floor(Date.now() / 1000) - 5,
      user: { id: 66, first_name: "Pat" },
    });
    const authRes = await app.request("/v1/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData }),
    });
    const { token } = (await authRes.json()) as { token: string };

    const res = await app.request("/v1/me", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        displayName: "Pat Updated",
        phone: "+15551234567",
        completeProfile: true,
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      user: {
        displayName: string;
        phone?: string;
        profileCompleted: boolean;
      };
    };
    expect(body.user.displayName).toBe("Pat Updated");
    expect(body.user.phone).toBe("+15551234567");
    expect(body.user.profileCompleted).toBe(true);
  });

  it("POST /v1/auth/recovery issues session for valid code", async () => {
    const { app, users } = makeApp();
    await users.upsertFromTelegram({
      userId: "900",
      displayName: "RecoverMe",
    });
    const code = users._rows.get("900")!.recoveryCode!;

    const res = await app.request("/v1/auth/recovery", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      token: string;
      user: { id: string; displayName: string };
    };
    expect(body.token.length).toBeGreaterThan(10);
    expect(body.user.id).toBe("900");
    expect(body.user.displayName).toBe("RecoverMe");
  });

  it("POST /v1/auth/recovery rejects unknown code", async () => {
    const { app } = makeApp();
    const res = await app.request("/v1/auth/recovery", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: "DH-ZZZZ-YYYY" }),
    });
    expect(res.status).toBe(401);
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

  describe("referral attribution", () => {
    it("sets referred_by when start_param=ref_<existing_user>", async () => {
    const users = createMemoryUserStore();
    await users.upsertFromTelegram({
      userId: "111",
      displayName: "Referrer",
    });
      const { app } = makeApp(users);

      const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
        authDate: Math.floor(Date.now() / 1000) - 5,
        user: { id: 222, first_name: "NewUser" },
        extra: { start_param: "ref_111" },
      });

      const res = await app.request("/v1/auth/telegram", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { user: { id: string; referredByUserId?: string } };
      expect(body.user.referredByUserId).toBe("111");
    });

    it("ignores self-referral (start_param=ref_<own_id>)", async () => {
      const users = createMemoryUserStore();
      const { app } = makeApp(users);

      const userId = "333";
      const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
        authDate: Math.floor(Date.now() / 1000) - 5,
        user: { id: Number(userId), first_name: "SelfRef" },
        extra: { start_param: `ref_${userId}` },
      });

      const res = await app.request("/v1/auth/telegram", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { user: { referredByUserId?: string } };
      expect(body.user.referredByUserId).toBeUndefined();
    });

    it("ignores start_param=ref_<nonexistent_user>", async () => {
      const { app } = makeApp();
      const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
        authDate: Math.floor(Date.now() / 1000) - 5,
        user: { id: 444, first_name: "NoRef" },
        extra: { start_param: "ref_99999" },
      });

      const res = await app.request("/v1/auth/telegram", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { user: { referredByUserId?: string } };
      expect(body.user.referredByUserId).toBeUndefined();
    });

    it("first-write-wins — second auth with different ref is ignored", async () => {
      const users = createMemoryUserStore();
      await users.upsertFromTelegram({ userId: "aaa", displayName: "RefA" });
      await users.upsertFromTelegram({ userId: "bbb", displayName: "RefB" });

      const { app } = makeApp(users);
      const userId = 555;
      const now = Math.floor(Date.now() / 1000);

      const first = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
        authDate: now - 5,
        user: { id: userId, first_name: "Target" },
        extra: { start_param: "ref_aaa" },
      });
      const r1 = await app.request("/v1/auth/telegram", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData: first }),
      });
      expect(r1.status).toBe(200);
      expect(((await r1.json()) as { user: { referredByUserId: string } }).user.referredByUserId).toBe("aaa");

      const second = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
        authDate: now - 4,
        user: { id: userId, first_name: "Target" },
        extra: { start_param: "ref_bbb" },
      });
      const r2 = await app.request("/v1/auth/telegram", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData: second }),
      });
      expect(r2.status).toBe(200);
      const body2 = (await r2.json()) as { user: { referredByUserId: string } };
      expect(body2.user.referredByUserId).toBe("aaa"); // unchanged
    });

    it("ignores referredByUserId in body when initData has no start_param", async () => {
      const { app } = makeApp();
      const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
        authDate: Math.floor(Date.now() / 1000) - 5,
        user: { id: 666, first_name: "SpoofTest" },
      });

      const res = await app.request("/v1/auth/telegram", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData, referredByUserId: "111" }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { user: { referredByUserId?: string } };
      expect(body.user.referredByUserId).toBeUndefined();
    });
  });
});

import type { Logger } from "../logger.js";
import type { Redis } from "ioredis";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { createRedisTokenBucket } from "./rate-limit-redis.js";

const errorSpy = vi.fn();

const noopLogger = {
  info: () => {},
  warn: () => {},
  error: errorSpy,
  debug: () => {},
  fatal: () => {},
  trace: () => {},
  child: () => noopLogger,
} as unknown as Logger;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createRedisTokenBucket", () => {
  it("returns 500 when Redis eval fails", async () => {
    const fakeRedis = {
      eval: vi.fn().mockRejectedValue(new Error("Redis connection lost")),
    } as unknown as Redis;

    const app = new Hono();
    app.use(
      "/test",
      createRedisTokenBucket({
        redis: fakeRedis,
        max: 10,
        windowMs: 60_000,
        key: () => "test-user",
        log: noopLogger,
      }),
    );
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test");
    expect(res.status).toBe(500);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("rate_limit_error");
  });

  it("logs the error when Redis eval fails", async () => {
    const fakeRedis = {
      eval: vi.fn().mockRejectedValue(new Error("timeout")),
    } as unknown as Redis;

    const app = new Hono();
    app.use(
      "/test",
      createRedisTokenBucket({
        redis: fakeRedis,
        max: 10,
        windowMs: 60_000,
        key: () => "test-user",
        log: noopLogger,
      }),
    );
    app.get("/test", (c) => c.json({ ok: true }));

    await app.request("/test");
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0]![0]).toMatchObject({
      err: expect.any(Error),
    });
  });
});

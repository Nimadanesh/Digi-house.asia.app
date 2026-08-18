import type { Context, MiddlewareHandler } from "hono";
import type { Redis } from "ioredis";
import type { Logger } from "../logger.js";

/**
 * Redis Lua script for token bucket rate limiting.
 * KEYS[1] = rate limit key (e.g. "rl:order:{userId}")
 * ARGV[1] = max tokens per window
 * ARGV[2] = window seconds
 * ARGV[3] = cost (1 = consume 1 token)
 *
 * Returns:
 *   0 = allowed (bucket had tokens)
 *   1 = rate limited (no tokens)
 */
const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]
local maxTokens = tonumber(ARGV[1])
local windowSec = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])

local now = redis.call("TIME")
local nowSec = tonumber(now[1])
local nowMs = tonumber(now[2])

local data = redis.call("HGETALL", key)
local tokens, lastRefillSec, lastRefillMs

if #data == 0 then
  tokens = maxTokens - cost
  lastRefillSec = nowSec
  lastRefillMs = nowMs
  redis.call("HSET", key, "tokens", tokens, "last_refill_sec", nowSec, "last_refill_ms", nowMs)
  redis.call("EXPIRE", key, windowSec)
  return 0
end

tokens = tonumber(data[2])
lastRefillSec = tonumber(data[4])
lastRefillMs = tonumber(data[6])

local elapsedMs = (nowSec - lastRefillSec) * 1000 + (nowMs - lastRefillMs)
local refillTokens = (elapsedMs / (windowSec * 1000)) * maxTokens

if refillTokens > 0 then
  tokens = math.min(maxTokens, tokens + refillTokens)
  lastRefillSec = nowSec
  lastRefillMs = nowMs
end

if tokens >= cost then
  tokens = tokens - cost
  redis.call("HSET", key, "tokens", tokens, "last_refill_sec", lastRefillSec, "last_refill_ms", lastRefillMs)
  redis.call("EXPIRE", key, windowSec)
  return 0
else
  return 1
end
`;

export function createRedisTokenBucket(opts: {
  redis: Redis;
  max: number;
  windowMs: number;
  key: (c: Context) => string;
  log: Logger;
}): MiddlewareHandler {
  const { redis, max, windowMs, key, log } = opts;
  const windowSec = Math.ceil(windowMs / 1000);

  return async (c, next) => {
    const k = `rl:order:${key(c)}`;

    try {
      const result = await redis.eval(
        TOKEN_BUCKET_SCRIPT,
        1,
        k,
        max,
        windowSec,
        1,
      );

      if (result === 1) {
        return c.json(
          { code: "rate_limit_exceeded", message: "Too many requests" },
          429,
        );
      }
    } catch (err) {
      log.error({ err, key: k }, "Redis rate limit check failed — denying request");
      return c.json(
        { code: "rate_limit_error", message: "Rate limit check failed" },
        500,
      );
    }

    await next();
  };
}

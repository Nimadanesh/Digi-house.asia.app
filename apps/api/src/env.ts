import { z } from "zod";

const boolish = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((v) => {
    if (v === true || v === "true" || v === "1") return true;
    return false;
  });

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(8787),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("debug"),
    SETTLEMENT_MODE: z.enum(["mock", "hybrid", "onchain"]).optional(),
    DATABASE_URL: z.string().optional(),
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    /** Preferred session signing secret (JWT HS256). */
    SESSION_SECRET: z.string().optional(),
    /** Alias for SESSION_SECRET (env-matrix). */
    JWT_SECRET: z.string().optional(),
    SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(604_800), // 7d
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
    /** Optional TON address for hybrid buy TonConnect stub messages. */
    TON_RELAY_ADDRESS: z.string().optional(),
    /** NanoTON amount string in prepare tonConnectMessages (default 0.01 TON). */
    BUY_STUB_NANOTON: z.string().default("10000000"),
    /** Buy intent TTL seconds (default 15m). */
    BUY_INTENT_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    /** Redis for BullMQ payout worker (optional for API process). */
    REDIS_URL: z.string().optional(),
    /** P4-06: Order rate limit max requests per window (default 30). */
    ORDER_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
    /** P4-06: Order rate limit window in ms (default 60s). */
    ORDER_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
    /**
     * Demo payout cadence in ms (default 60s).
     * NOT production Friday calendar — ADR-003.
     */
    PAYOUT_TICK_MS: z.coerce.number().int().positive().default(60_000),
    /** Kill switch — worker process no-ops when false (default). */
    PAYOUT_WORKER_ENABLED: boolish,
    /** Optional manual tick route (not mounted in P1-13 by default). */
    ALLOW_MANUAL_PAYOUT_TICK: boolish,
    /** P4-01: Telegram notify on earnings paid (default true in staging docs).
     *  Only active when PAYOUT_WORKER_ENABLED=true + TELEGRAM_BOT_TOKEN set. */
    NOTIFY_EARNINGS_PAID: boolish,
    /** P4-03: Admin API secret for /v1/admin/* routes (optional — routes not mounted if unset). */
    ADMIN_API_SECRET: z.string().optional(),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),
    R2_PUBLIC_BASE_URL: z.string().optional(),
    PAYOUT_TICK_SECRET: z.string().optional(),

    /** Indexer (Phase 3A) — TonAPI configuration. */
    TON_API_URL: z.string().default("https://testnet.tonapi.io"),
    TON_API_KEY: z.string().optional(),

    /** Indexer worker poll interval in ms (default 10s). */
    INDEXER_POLL_MS: z.coerce.number().int().positive().default(10_000),
    /** Kill switch — indexer process no-ops when false (default). */
    INDEXER_ENABLED: boolish,
  })
  .superRefine((val, ctx) => {
    const secret = val.SESSION_SECRET ?? val.JWT_SECRET;
    if (val.NODE_ENV === "production") {
      if (!secret || secret.length < 32) {
        ctx.addIssue({
          code: "custom",
          message:
            "SESSION_SECRET (or JWT_SECRET) required in production (≥32 chars)",
          path: ["SESSION_SECRET"],
        });
      }
    }
  })
  .transform((val) => {
    const sessionSecret =
      val.SESSION_SECRET ??
      val.JWT_SECRET ??
      (val.NODE_ENV === "production"
        ? ""
        : "dev-only-session-secret-min-32-chars!!");
    return {
      NODE_ENV: val.NODE_ENV,
      PORT: val.PORT,
      LOG_LEVEL: val.LOG_LEVEL,
      SETTLEMENT_MODE: val.SETTLEMENT_MODE,
      DATABASE_URL: val.DATABASE_URL,
      TELEGRAM_BOT_TOKEN: val.TELEGRAM_BOT_TOKEN ?? "",
      SESSION_SECRET: sessionSecret,
      SESSION_TTL_SECONDS: val.SESSION_TTL_SECONDS,
      CORS_ORIGIN: val.CORS_ORIGIN,
      TON_RELAY_ADDRESS: val.TON_RELAY_ADDRESS,
      BUY_STUB_NANOTON: val.BUY_STUB_NANOTON,
      BUY_INTENT_TTL_SECONDS: val.BUY_INTENT_TTL_SECONDS,
      REDIS_URL: val.REDIS_URL,
      ORDER_RATE_LIMIT_MAX: val.ORDER_RATE_LIMIT_MAX,
      ORDER_RATE_LIMIT_WINDOW_MS: val.ORDER_RATE_LIMIT_WINDOW_MS,
      PAYOUT_TICK_MS: val.PAYOUT_TICK_MS,
      PAYOUT_WORKER_ENABLED: val.PAYOUT_WORKER_ENABLED,
      ALLOW_MANUAL_PAYOUT_TICK: val.ALLOW_MANUAL_PAYOUT_TICK,
      PAYOUT_TICK_SECRET: val.PAYOUT_TICK_SECRET,
      ADMIN_API_SECRET: val.ADMIN_API_SECRET,
      R2_ACCOUNT_ID: val.R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID: val.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: val.R2_SECRET_ACCESS_KEY,
      R2_BUCKET: val.R2_BUCKET,
      R2_PUBLIC_BASE_URL: val.R2_PUBLIC_BASE_URL,
      NOTIFY_EARNINGS_PAID: val.NOTIFY_EARNINGS_PAID,
      TON_API_URL: val.TON_API_URL,
      TON_API_KEY: val.TON_API_KEY,
      INDEXER_POLL_MS: val.INDEXER_POLL_MS,
      INDEXER_ENABLED: val.INDEXER_ENABLED,
    };
  });

export type ApiEnv = z.output<typeof envSchema>;

export function loadEnv(raw: NodeJS.ProcessEnv = process.env): ApiEnv {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid API env: ${msg}`);
  }
  return parsed.data;
}

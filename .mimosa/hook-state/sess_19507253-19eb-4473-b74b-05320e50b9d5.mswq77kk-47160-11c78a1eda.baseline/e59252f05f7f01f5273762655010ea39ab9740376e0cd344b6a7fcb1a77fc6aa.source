import pino from "pino";
import type { ApiEnv } from "./env.js";

export function createLogger(env: ApiEnv) {
  const isDev = env.NODE_ENV === "development";
  return pino({
    level: env.LOG_LEVEL,
    ...(isDev
      ? {
          transport: {
            target: "pino-pretty",
            options: { colorize: true, translateTime: "SYS:standard" },
          },
        }
      : {}),
  });
}

export type Logger = ReturnType<typeof createLogger>;

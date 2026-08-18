import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

export type Db = ReturnType<typeof createDb>;

/**
 * Create a Drizzle client. Caller must provide DATABASE_URL.
 * Not used by /healthz (P1-01); wire in routes from P1-05+.
 */
export function createDb(databaseUrl: string) {
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required. Copy apps/api/.env.example → .env and run npm run infra:up",
    );
  }
  const sql = postgres(databaseUrl, { max: 10 });
  return drizzle(sql, { schema });
}

export function requireDatabaseUrl(
  raw: NodeJS.ProcessEnv = process.env,
): string {
  const url = raw.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is missing. Set it in apps/api/.env (see .env.example) after npm run infra:up",
    );
  }
  return url;
}

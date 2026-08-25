import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { createDb, requireDatabaseUrl } from "../client.js";
import { properties } from "../schema/properties.js";
import { toPropertyInsert } from "./map-property.js";
import { loadManifestSeedProperties } from "./manifest-data.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(__dirname, "../../..");

function loadLocalEnvFile() {
  const path = join(apiRoot, ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

async function main() {
  loadLocalEnvFile();
  const url = requireDatabaseUrl();
  const db = createDb(url);

  const rows = loadManifestSeedProperties().map(toPropertyInsert);
  const statuses = new Set(rows.map((r) => r.status));
  if (rows.length !== 24) {
    throw new Error(`Seed must have exactly 24 manifest properties, got ${rows.length}`);
  }
  for (const need of ["funding", "funded", "resale"] as const) {
    if (!statuses.has(need)) {
      throw new Error(`Seed missing status: ${need}`);
    }
  }

  // A3: remove legacy seed listings not in the manifest so exactly the 24
  // contract properties exist. If dev rows (holdings/orders) still reference
  // them, keep seeding and warn instead of failing.
  const manifestIds = new Set(rows.map((r) => r.id));
  try {
    await db.execute(
      sql`DELETE FROM ${properties} WHERE ${properties.id} NOT IN (${sql.join(
        [...manifestIds].map((id) => sql`${id}`),
        sql`, `,
      )})`,
    );
  } catch (err) {
    console.warn(
      `Could not prune legacy properties (dependent rows exist?): ${
        err instanceof Error ? err.message : err
      }`,
    );
  }

  for (const row of rows) {
    await db
      .insert(properties)
      .values(row)
      .onConflictDoUpdate({
        target: properties.id,
        set: {
          title: row.title,
          location: row.location,
          description: row.description,
          images: row.images,
          totalShares: row.totalShares,
          sharePriceUsd: row.sharePriceUsd,
          status: row.status,
          ownerWalletAddress: row.ownerWalletAddress,
          annualRentUsd: row.annualRentUsd,
          sharesSold: row.sharesSold,
          meta: row.meta,
          rentalHistory: row.rentalHistory,
          updatedAt: row.updatedAt,
        },
      });
  }

  const countResult = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(properties);
  const count = countResult[0]?.n ?? 0;

  console.log(
    `Seeded ${rows.length} properties (idempotent upsert by id). table_count=${count} statuses=${[...statuses].join(",")}`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

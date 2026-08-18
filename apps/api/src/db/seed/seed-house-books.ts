import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createDb, requireDatabaseUrl } from "../client.js";
import { createDbPropertyStore } from "../../marketplace/property-store.js";
import { createDbOrderStore } from "../../orders/order-store.js";
import { createDbTradeStore } from "../../orders/trade-store.js";
import { createDbHoldingStore } from "../../portfolio/holding-store.js";
import { createDbBalanceStore } from "../../money/balance-store.js";
import { createDbFeeTierStore } from "../../fees/fee-tier-store.js";
import { createDbTxStore } from "../../buys/tx-store.js";
import {
  seedHouseBook,
  type AdminRouteDeps,
} from "../../routes/admin.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// apps/api/ — where the .env lives (same as seed-properties.ts).
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

// Optional overrides (env): SEED_LEVELS, SEED_SPREAD_PCT, SEED_QTY_PER_LEVEL.
// Each is clamped by seedHouseBook to safe bounds.
function readOpts() {
  const n = (v: string | undefined) =>
    v !== undefined && v.trim() !== "" ? Number(v) : undefined;
  return {
    levels: n(process.env.SEED_LEVELS),
    spreadPct: n(process.env.SEED_SPREAD_PCT),
    qtyPerLevel: n(process.env.SEED_QTY_PER_LEVEL),
  };
}

async function main() {
  loadLocalEnvFile();
  const url = requireDatabaseUrl();
  const db = createDb(url);

  const deps: AdminRouteDeps = {
    adminSecret: "seed-script",
    properties: createDbPropertyStore(db),
    orders: createDbOrderStore(db),
    trades: createDbTradeStore(db),
    holdings: createDbHoldingStore(db),
    balances: createDbBalanceStore(db),
    feeTiers: createDbFeeTierStore(db),
    transactions: createDbTxStore(db),
    houseAccountUserId:
      process.env.HOUSE_ACCOUNT_USER_ID?.trim() || "house-account",
  };

  // Secondary books = resale + funded (G8: funded behaves like resale for orders).
  const secondary = [
    ...(await deps.properties.list({ status: "resale" })),
    ...(await deps.properties.list({ status: "funded" })),
  ];
  if (secondary.length === 0) {
    console.log("No secondary (resale/funded) properties to seed.");
    return;
  }

  const opts = readOpts();
  const seeded: string[] = [];
  const skipped: Array<{ id: string; reason: string }> = [];

  for (const listing of secondary) {
    // Idempotence guard: skip books that already carry a live house order
    // (re-running the seed shouldn't pile up duplicate liquidity).
    const open = await deps.orders!.listOpenByPropertyId(listing.id);
    if (open.some((o) => o.isHouseAccount)) {
      skipped.push({ id: listing.id, reason: "already_seeded" });
      continue;
    }
    const result = await seedHouseBook(deps, listing.id, opts);
    if (!result.ok) {
      skipped.push({ id: listing.id, reason: result.error });
      continue;
    }
    seeded.push(
      `${listing.id} (${result.orders.length} orders around $${(result.referencePriceUsd / 100).toFixed(2)}, ${result.executedQuantity} filled)`,
    );
  }

  console.log(
    `Seeded house books on ${seeded.length}/${secondary.length} secondary properties (levels=${opts.levels ?? "default"} spreadPct=${opts.spreadPct ?? "default"} qtyPerLevel=${opts.qtyPerLevel ?? "default"}).`,
  );
  for (const line of seeded) console.log(`  ✓ ${line}`);
  for (const s of skipped) console.log(`  – skipped ${s.id}: ${s.reason}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

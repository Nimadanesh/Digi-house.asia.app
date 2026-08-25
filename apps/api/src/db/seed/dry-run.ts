/**
 * A3 dry-run: validate + map the 24-property manifest without a database.
 * Usage: npm run db:seed:dryrun -w @digihouse/api
 */
import { toPropertyInsert } from "./map-property.js";
import { loadManifestSeedProperties } from "./manifest-data.js";

const seeds = loadManifestSeedProperties();
const rows = seeds.map(toPropertyInsert);

console.log(`manifest properties: ${seeds.length}`);
for (const [s, r] of seeds.map((s, i) => [s, rows[i]!] as const)) {
  console.log(
    `${r.id}  $${(r.sharePriceUsd / 100).toFixed(0)}/share  ${r.totalShares} shares  ` +
      `${r.status}  sold=${r.sharesSold}  ${r.location}`,
    s.id === r.id && s.totalShares === r.totalShares ? "" : "MISMATCH",
  );
}
const statuses = new Set(rows.map((r) => r.status));
console.log(`statuses=${[...statuses].join(",")}`);

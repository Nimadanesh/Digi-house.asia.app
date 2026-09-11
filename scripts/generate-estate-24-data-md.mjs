// Generates docs/product/rebuild/ESTATE-24-DATA.md from ESTATE-24-DATA.json.
// The JSON is the single editable source of truth; this Markdown is a read-only
// companion. DO NOT EDIT the output by hand — change the JSON and re-run:
//   node scripts/generate-estate-24-data-md.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const records = JSON.parse(
  readFileSync(join(root, "docs/product/rebuild/ESTATE-24-DATA.json"), "utf-8"),
);

const money = (n) =>
  n == null ? "—" : "$" + Number(n).toLocaleString("en-US");

const lines = [];
lines.push(`# FractionalLuxe — Estate 24 Data (generated companion)`);
lines.push(``);
lines.push(`> GENERATED FILE — DO NOT EDIT BY HAND.`);
lines.push(`> Source of truth: \`docs/product/rebuild/ESTATE-24-DATA.json\`.`);
lines.push(`> Regenerate: \`node scripts/generate-estate-24-data-md.mjs\`.`);
lines.push(`> Generated: ${new Date().toISOString().slice(0, 10)} · Records: ${records.length}`);
lines.push(``);
lines.push(`Canonical share-supply model (Final PO Decisions 1–2):`);
lines.push(`\`Total shares = property valuation ÷ $100\` · \`Base price = $100/share (primary offering)\`.`);
lines.push(`Secondary-market pricing is separate and demand-driven. Profit is monthly;`);
lines.push(`four transfers are a payment schedule, never weekly profit (Decisions 3–4).`);
lines.push(`ADR, occupancy, annual revenue, and yield are UNKNOWN unless a record says`);
lines.push(`otherwise — this companion never invents them.`);
lines.push(``);
lines.push(`## Index`);
lines.push(``);
lines.push(`| # | Estate | Location | Listing ID | Valuation (approved) | Status |`);
lines.push(`|---|---|---|---|---|---|`);
for (const r of records) {
  lines.push(
    `| ${r.id} | ${r.name} | ${r.location.full} | ${r.listingId} | ` +
    `${money(r.valuation?.approved?.central)} | ${r.consolidation?.status ?? "—"} |`,
  );
}
lines.push(``);

for (const r of records) {
  lines.push(`---`);
  lines.push(``);
  lines.push(`## ${r.id}. ${r.name}`);
  lines.push(``);
  lines.push(`- Location: ${r.location.full} (${r.location.place}, ${r.location.region}, ${r.location.country})`);
  lines.push(`- Rental Escapes listing ID: ${r.listingId}`);
  lines.push(`- Source: ${r.sourceUrl}`);
  lines.push(`- Property type: ${r.propertyType}`);
  const s = r.specs ?? {};
  lines.push(
    `- Specs: ${s.guests ?? "—"} guests · ${s.bedrooms ?? "—"} bd · ${s.bathrooms ?? "—"} ba` +
    (s.halfBathrooms ? ` (+${s.halfBathrooms} half)` : ``) +
    ` · interior ${s.sizeInteriorM2 ?? "—"} m² · total ${s.sizeTotalM2 ?? "—"} m²` +
    (s.poolM2 ? ` · pool ${s.poolM2} m²` : ``) +
    (s.landHa ? ` · land ${s.landHa} ha` : ``) +
    (s.landNote ? ` (${s.landNote})` : ``),
  );
  lines.push(`- Nightly rate (observed display): ${r.rates?.nightly ?? "—"} [${r.rates?.type ?? "—"}, ${r.rates?.currency ?? "—"}]`);
  if (r.rates?.notes) lines.push(`  - Notes: ${r.rates.notes}`);
  if (r.rates?.observedPeriod) lines.push(`  - Observed: ${r.rates.observedPeriod}`);
  const v = r.valuation ?? {};
  lines.push(`- Valuation status: ${v.status ?? "—"}`);
  if (v.approved)
    lines.push(
      `- Valuation approved (${v.approved.provenance ?? "—"}): central ${money(v.approved.central)}` +
      (v.approved.range ? ` · range ${money(v.approved.range[0])}–${money(v.approved.range[1])}` : ``) +
      (v.approved.label ? ` · ${v.approved.label}` : ``),
    );
  if (v.research)
    lines.push(
      `- Valuation research (${v.research.provenance ?? "—"}, ${v.research.confidence ?? "—"}): ` +
      `central ${money(v.research.central)}` +
      (v.research.range ? ` · range ${money(v.research.range[0])}–${money(v.research.range[1])}` : ``),
    );
  for (const leg of v.legacy ?? [])
    lines.push(`- Legacy quarantined (${leg.provenance}): ${leg.label} = ${money(leg.value)} — ${leg.note}`);
  const rt = r.rateTable;
  if (rt) {
    lines.push(`- Rate table: ${rt.status} · ${rt.seasons?.length ?? 0} season(s), observed ${rt.observedAt ?? "—"}`);
    if (rt.averageNightlyRate)
      lines.push(
        `  - ANR ${money(rt.averageNightlyRate.value)} ${rt.averageNightlyRate.currency} ` +
        `(${rt.averageNightlyRate.provenance}; ${rt.averageNightlyRate.method})`,
      );
    else lines.push(`  - ANR: none (never ADR, never average of holidays as fact)`);
  }
  lines.push(`- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).`);
  const taxes = r.taxesListing;
  if (taxes && ((taxes.taxes?.length ?? 0) + (taxes.fees?.length ?? 0) > 0)) {
    lines.push(`- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):`);
    for (const t of taxes.taxes ?? [])
      lines.push(`  - tax: ${t.name} (${t.kind} ${t.value}${t.unit ? ` ${t.unit}` : ""}${t.currency ? ` ${t.currency}` : ""}; ${t.status ?? "unclassified"})`);
    for (const f of taxes.fees ?? [])
      lines.push(`  - fee: ${f.name} (${f.amount} ${f.currency}${f.unit ? `/${f.unit}` : ""}; ${f.status ?? "unclassified"})`);
  }
  if ((r.conflicts ?? []).length > 0) {
    lines.push(`- Conflicts:`);
    for (const c of r.conflicts) lines.push(`  - [${c.id}] ${c.field}: ${c.summary} → ${c.treatment}`);
  }
  if (r.consolidation)
    lines.push(`- Consolidation: ${r.consolidation.status} (${r.consolidation.updatedAt ?? "—"}; ${r.consolidation.evidence ?? "—"})`);
  for (const g of r.consolidation?.gaps ?? []) lines.push(`  - gap: ${g}`);
  lines.push(`- Research: confidence ${r.research?.confidence ?? "—"} · updated ${r.research?.lastUpdated ?? "—"}`);
  lines.push(``);
}

writeFileSync(join(root, "docs/product/rebuild/ESTATE-24-DATA.md"), lines.join("\n") + "\n");
console.log(`wrote ESTATE-24-DATA.md (${records.length} records)`);

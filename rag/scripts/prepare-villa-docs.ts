/**
 * prepare-villa-docs.ts — convert docs/product/rebuild/ESTATE-24-DATA.json into
 * one clean Markdown document per villa under rag/knowledge-base/villas/.
 *
 * Run from the repo root:
 *   node --experimental-strip-types rag/scripts/prepare-villa-docs.ts
 *
 * Deterministic by design: no clock, no randomness, no locale-dependent ordering —
 * identical input produces byte-identical output.
 *
 * Ground rules encoded here (do not weaken):
 * - Canonical property ids are `re-<listingId>` (cross-repo contracts; never renamed).
 * - Unknown values render as "Unknown — not established in current data"; never guessed.
 * - QUARANTINED (CONFLICTED) legacy values are rendered as invalid evidence only.
 * - No number is ever invented: season-table ranges are min/max over LISTED prices only,
 *   identical rows are merged, and the full detail stays in the source dataset.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..', '..');
const SOURCE_PATH = join(repoRoot, 'docs', 'product', 'rebuild', 'ESTATE-24-DATA.json');
const OUT_DIR = join(repoRoot, 'rag', 'knowledge-base', 'villas');
const GENERATED_FILE_PATTERN = /^re-\d+-.*\.md$/;

// ---------------------------------------------------------------------------
// Types — mirror of the dataset fields this script renders (typed narrowly;
// the JSON is cast once below and validated at runtime).
// ---------------------------------------------------------------------------

interface VillaLocation {
  country: string;
  region: string;
  place: string;
  full: string;
}

interface VillaSpecs {
  guests: number;
  bedrooms: number;
  bathrooms: number;
  sizeInteriorM2: number;
  sizeTotalM2: number;
  poolM2: number | null;
  landHa: number | null;
  landNote: string | null;
}

interface VillaDescription {
  short: string;
  full: string;
  seasonality: string;
}

interface TaxEntry {
  type: 'percentage' | 'fixed' | 'variable';
  value: number | null;
  name?: string;
  unit?: string;
  currency?: string;
  note?: string;
}

interface OtherFee {
  type: 'percentage' | 'fixed' | 'variable';
  value: number | null;
  name?: string;
  note?: string;
  currency?: string;
}

interface TaxesAndFees {
  tourismTax: TaxEntry | null;
  serviceCharge: TaxEntry | null;
  greenTax: TaxEntry | null;
  damageWaiver: TaxEntry | null;
  other: OtherFee[];
}

interface CostStructureDefaults {
  tourismTaxPct?: number;
  tourismTaxFixedPerPersonNight?: number;
  tourismTaxNote?: string;
  serviceChargePct?: number;
  agencyOtaPct?: number;
  operatorPct?: number;
  greenTaxPerGuestNight?: number;
  repairInsurancePctOfValue?: number;
}

interface VillaEstimates {
  valueCentral: number;
  valueRange: number[];
  occupancy: number | null;
  provenance: string;
}

interface VillaResearch {
  confidence: string;
  lastUpdated: string;
  sources: string[];
}

interface RatePeriod {
  startDate: string;
  endDate: string;
}

interface RateSeason {
  name: string;
  periods?: RatePeriod[];
  pricingBasis: string;
  nightly: number | null;
  weekly: number | null;
  nightlyDerived: number | null;
  minStay?: number[];
  currency: string;
}

interface RateTable {
  status: string;
  currency: string;
  seasons: RateSeason[];
}

interface VillaRates {
  nightly: string;
  type: string;
  currency: string;
  notes?: string;
  observedPeriod?: string;
}

interface ValuationLeg {
  central?: number;
  range?: number[];
  provenance: string;
  confidence?: string;
  source?: string;
  label?: string;
}

interface ValuationLegacyEntry {
  label: string;
  value: number;
  provenance: string;
  note?: string;
}

interface VillaValuation {
  approved?: ValuationLeg;
  research?: ValuationLeg;
  legacy?: ValuationLegacyEntry[];
  status?: string;
}

interface VillaConflict {
  id: string;
  field: string;
  summary: string;
  treatment: string;
}

interface VillaConsolidation {
  status: string;
  gaps: string[];
  updatedAt?: string;
}

interface VillaStayRules {
  checkIn?: string;
  checkOut?: string;
  minStayNights?: number[];
  policies: string[];
  observedAt?: string;
  source?: string;
}

interface VillaServices {
  included: string[];
  staff: string[];
  extraCost: string[];
}

interface VillaAmenities {
  general: string[];
  outdoor: string[];
  indoor: string[];
  kitchen: string[];
  entertainment: string[];
  activities: string[];
  nearby: string[];
}

interface VillaRecord {
  id: number;
  listingId: string;
  name: string;
  slug: string;
  location: VillaLocation;
  propertyType: string;
  sourceUrl: string;
  specs: VillaSpecs;
  description: VillaDescription;
  amenities: VillaAmenities;
  services: VillaServices;
  rates: VillaRates;
  taxesAndFees: TaxesAndFees;
  costStructureDefaults: CostStructureDefaults;
  estimates: VillaEstimates;
  research: VillaResearch;
  rateTable: RateTable;
  valuation?: VillaValuation;
  conflicts?: VillaConflict[];
  consolidation?: VillaConsolidation;
  stayRules?: VillaStayRules;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const UNKNOWN = 'Unknown — not established in current data';
const SOURCE_NOTE =
  'Full unsummarized detail: `docs/product/rebuild/ESTATE-24-DATA.json` (canonical research dataset).';

function money(n: number, currency: string): string {
  const amount = n.toLocaleString('en-US');
  return currency === 'USD' ? `$${amount}` : `${amount} ${currency}`;
}

function fmtRange(range: number[] | undefined, currency: string): string | null {
  if (!range || range.length !== 2 || typeof range[0] !== 'number' || typeof range[1] !== 'number') {
    return null;
  }
  return `${money(range[0], currency)}–${money(range[1], currency)}`;
}

/** Escapes a string for use inside a Markdown table cell (pipes break tables). */
function mdCell(s: string): string {
  return s.replace(/\|/g, '\\|');
}

function yamlQuote(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function bullets(items: string[]): string[] {
  return items.map((item) => `- ${item}`);
}

function nonEmpty(values: Array<string | null | undefined>): string[] {
  return values.filter((v): v is string => typeof v === 'string' && v.length > 0);
}

/** First sentence of a prose string (deterministic split on sentence punctuation). */
function firstSentence(s: string): string {
  const match = s.match(/^.*?[.!?](?=\s|$)/);
  return (match ? match[0] : s).trim();
}

/** Renders one taxesAndFees entry as a bullet, preserving names/units/notes. */
function taxBullet(label: string, entry: TaxEntry | null | undefined): string | null {
  if (!entry) return null;
  const parts: string[] = [];
  if (entry.type === 'percentage' && typeof entry.value === 'number') {
    parts.push(`${entry.value}%`);
  } else if (entry.type === 'fixed' && typeof entry.value === 'number') {
    const currency = entry.currency ?? '';
    parts.push(`${entry.value.toLocaleString('en-US')}${currency ? ` ${currency}` : ''}${entry.unit ? ` ${entry.unit}` : ''}`.trim());
  } else {
    parts.push('variable');
  }
  if (entry.name) parts.push(`(${entry.name})`);
  if (entry.note) parts.push(`— ${entry.note}`);
  return `**${label}:** ${parts.join(' ')}`;
}

/** Renders an `other` fee (security deposit, admin fee, …) as a clean bullet. */
function otherFeeBullet(fee: OtherFee): string | null {
  if (!fee || typeof fee.value !== 'number') return null;
  const amount =
    fee.type === 'percentage'
      ? `${fee.value}%`
      : fee.type === 'fixed'
        ? money(fee.value, fee.currency ?? '')
        : 'variable';
  const label = fee.name ?? 'Other fee';
  return `**${label}:** ${amount}${fee.note ? ` — ${fee.note}` : ''}`;
}

function taxSection(v: VillaRecord): string[] {
  const t = v.taxesAndFees;
  const lines = bullets(
    nonEmpty([
      taxBullet('Tourism tax', t.tourismTax),
      taxBullet('Service charge', t.serviceCharge),
      taxBullet('Green tax', t.greenTax),
      taxBullet('Damage waiver', t.damageWaiver),
      ...t.other.map(otherFeeBullet),
    ]),
  );
  return lines.length > 0 ? ['## Taxes & fees', '', ...lines] : [];
}

// ---------------------------------------------------------------------------
// Season-rate summarization
//
// Long tables come from (a) exact duplicate rows and (b) the same season listed
// once per room/package configuration with different prices. Summarization is
// lossless in pricing terms: identical rows merge; identical name + basis +
// min-stay + period windows collapse into a min–max over the LISTED prices
// only. No number is invented; the source dataset keeps full detail.
// ---------------------------------------------------------------------------

interface MergedSeasonRow {
  name: string;
  basis: string;
  minStay: number[];
  periodSignature: string;
  prices: number[];
  currency: string;
}

function summarizeSeasons(v: VillaRecord): { rows: MergedSeasonRow[]; collapsedVariants: boolean } {
  const rows: MergedSeasonRow[] = [];
  const index = new Map<string, MergedSeasonRow>();
  for (const season of v.rateTable.seasons) {
    const periods = (season.periods ?? []).map((p) => `${p.startDate} → ${p.endDate}`).sort();
    const periodSignature = [...new Set(periods)].join('; ');
    const price =
      season.pricingBasis === 'WEEKLY'
        ? season.weekly
        : (season.nightly ?? season.nightlyDerived);
    const key = `${season.name}|${season.pricingBasis}|${(season.minStay ?? []).join(',')}|${periodSignature}`;
    const existing = index.get(key);
    if (existing) {
      if (price !== null) existing.prices.push(price);
    } else {
      index.set(key, {
        name: season.name,
        basis: season.pricingBasis,
        minStay: season.minStay ?? [],
        periodSignature,
        prices: price === null ? [] : [price],
        currency: season.currency,
      });
      rows.push(index.get(key) as MergedSeasonRow);
    }
  }
  const collapsedVariants = rows.some((row) => new Set(row.prices).size > 1);
  return { rows, collapsedVariants };
}

function priceCellOf(row: MergedSeasonRow): string {
  const distinct = [...new Set(row.prices)].sort((a, b) => a - b);
  if (distinct.length === 0) return UNKNOWN;
  if (distinct.length === 1) return money(distinct[0], row.currency);
  return `${money(distinct[0], row.currency)}–${money(distinct[distinct.length - 1], row.currency)}`;
}

function seasonTableSection(v: VillaRecord): string[] {
  const { rows, collapsedVariants } = summarizeSeasons(v);
  if (rows.length === 0) return [];
  const lines: string[] = ['### Season rate summary', ''];
  lines.push('| Season | Basis | Listed rate | Min stay (nights) | Periods |');
  lines.push('|---|---|---|---|---|');
  for (const row of rows) {
    const cells = [
      mdCell(row.name),
      row.basis,
      priceCellOf(row),
      row.minStay.length > 0 ? row.minStay.join(', ') : '—',
      mdCell(row.periodSignature || '—'),
    ];
    lines.push(`| ${cells.join(' | ')} |`);
  }
  if (collapsedVariants) {
    lines.push(
      '',
      `> Where the listing showed several variants (e.g., room or package configurations) for identical periods, the table shows the min–max range of the listed prices. ${SOURCE_NOTE}`,
    );
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function frontMatter(v: VillaRecord, propertyId: string): string[] {
  return [
    '---',
    'docType: villa',
    `propertyId: ${propertyId}`,
    `name: ${yamlQuote(v.name)}`,
    `destination: ${yamlQuote(v.location.country)}`,
    `dataConfidence: ${yamlQuote(v.research.confidence)}`,
    '---',
  ];
}

function keyHighlights(v: VillaRecord): string[] {
  const s = v.specs;
  const size =
    typeof s.sizeTotalM2 === 'number' && typeof s.sizeInteriorM2 === 'number'
      ? `${s.sizeTotalM2} m² total · ${s.sizeInteriorM2} m² interior`
      : typeof s.sizeTotalM2 === 'number'
        ? `${s.sizeTotalM2} m² total`
        : typeof s.sizeInteriorM2 === 'number'
          ? `${s.sizeInteriorM2} m² interior`
          : null;
  return nonEmpty([
    `${v.propertyType} in ${v.location.place}`,
    `${s.guests} guests · ${s.bedrooms} bedrooms · ${s.bathrooms} bathrooms`,
    size,
    typeof s.poolM2 === 'number' ? `Pool: ${s.poolM2} m²` : null,
    typeof s.landHa === 'number' ? `Grounds: ${s.landHa} ha` : null,
    firstSentence(v.description.seasonality),
    v.services.included[0],
    v.amenities.outdoor.length > 0 ? `Outdoor: ${v.amenities.outdoor.slice(0, 3).join(', ')}` : null,
    v.amenities.activities.length > 0 ? `Activities: ${v.amenities.activities.slice(0, 3).join(', ')}` : null,
  ]);
}

function descriptionSection(v: VillaRecord): string[] {
  return [
    '## Description',
    '',
    v.description.short,
    '',
    v.description.full,
    '',
    '### Key highlights',
    '',
    ...bullets(keyHighlights(v)),
  ];
}

function stayRulesSection(v: VillaRecord): string[] {
  const rules = v.stayRules;
  const lines = nonEmpty([
    rules?.checkIn ? `Check-in: ${rules.checkIn}` : null,
    rules?.checkOut ? `Check-out: ${rules.checkOut}` : null,
    rules?.minStayNights && rules.minStayNights.length > 0
      ? `Minimum stay: ${rules.minStayNights.join(', ')} night(s)`
      : null,
    ...(rules?.policies ?? []),
  ]);
  return lines.length > 0 ? ['## Stay rules', '', ...bullets(lines)] : [];
}

function ratesSection(v: VillaRecord): string[] {
  const lines = nonEmpty([
    `Listed rate: ${v.rates.nightly} (${v.rates.type}, ${v.rates.currency})`,
    v.rates.observedPeriod ? `Rate observation period: ${v.rates.observedPeriod}` : null,
    v.rates.notes ? `Rate notes: ${v.rates.notes}` : null,
    v.rateTable.status !== 'FULL' ? `Rate-table coverage in source data: ${v.rateTable.status}` : null,
  ]);
  const table = seasonTableSection(v);
  return ['## Rates', '', ...bullets(lines), ...(table.length > 0 ? ['', ...table] : [])];
}

function valuationSection(v: VillaRecord): string[] {
  const val = v.valuation;
  const lines: string[] = [];
  if (val?.approved) {
    const range = fmtRange(val.approved.range, 'USD');
    lines.push(
      `- **Approved:** ${val.approved.central !== undefined ? money(val.approved.central, 'USD') : 'no central value'}` +
        `${range ? ` (range ${range})` : ''}` +
        `${val.approved.label ? ` — ${val.approved.label}` : ''}` +
        `${val.approved.source ? ` — Source: ${val.approved.source}` : ''}`,
    );
  }
  if (val?.research) {
    const range = fmtRange(val.research.range, 'USD');
    lines.push(
      `- **Research estimate:** ${val.research.central !== undefined ? money(val.research.central, 'USD') : 'no central value'}` +
        `${range ? ` (range ${range})` : ''}` +
        `${val.research.confidence ? ` — confidence ${val.research.confidence}` : ''}` +
        `${val.research.source ? ` — Source: ${val.research.source}` : ''}`,
    );
  }
  for (const legacy of val?.legacy ?? []) {
    lines.push(
      `- **QUARANTINED (CONFLICTED) — never quote as valid:** ${legacy.label} = ${money(legacy.value, 'USD')}` +
        `${legacy.note ? ` — ${legacy.note}` : ''}`,
    );
  }
  lines.push(`- Occupancy: ${v.estimates.occupancy === null ? UNKNOWN : `${v.estimates.occupancy}%`}`);
  if (val?.status) {
    lines.unshift(`Valuation status: **${val.status}**`, '');
  }
  return ['## Valuation & data provenance', '', `All valuation figures in USD.`, '', ...lines];
}

function costDefaultsSection(v: VillaRecord): string[] {
  const d = v.costStructureDefaults;
  const rows = nonEmpty([
    d.tourismTaxPct !== undefined ? `Tourism tax: ${d.tourismTaxPct}%` : null,
    d.tourismTaxFixedPerPersonNight !== undefined
      ? `Tourism tax (fixed): ${d.tourismTaxFixedPerPersonNight} per person-night`
      : null,
    d.tourismTaxNote ? `Tourism tax note: ${d.tourismTaxNote}` : null,
    d.serviceChargePct !== undefined ? `Service charge: ${d.serviceChargePct}%` : null,
    d.agencyOtaPct !== undefined ? `Agency + Rental + OTA: ${d.agencyOtaPct}%` : null,
    d.operatorPct !== undefined ? `Operator operating costs: ${d.operatorPct}%` : null,
    d.greenTaxPerGuestNight !== undefined ? `Green tax: $${d.greenTaxPerGuestNight} per guest-night` : null,
    d.repairInsurancePctOfValue !== undefined
      ? `Repair/insurance/maintenance reserve: ${d.repairInsurancePctOfValue}% of property value`
      : null,
  ]);
  if (rows.length === 0) return [];
  return [
    '## Cost-structure defaults (model assumptions, not observed facts)',
    '',
    ...bullets(rows),
  ];
}

function servicesAndAmenitiesSection(v: VillaRecord): string[] {
  const groups: Array<[string, string[]]> = [
    ['Services included', v.services.included],
    ['Staff', v.services.staff],
    ['Extra-cost services', v.services.extraCost],
    ['Amenities (general)', v.amenities.general],
    ['Amenities (outdoor)', v.amenities.outdoor],
    ['Amenities (indoor)', v.amenities.indoor],
    ['Amenities (kitchen)', v.amenities.kitchen],
    ['Amenities (entertainment)', v.amenities.entertainment],
    ['Activities nearby', v.amenities.activities],
    ['Nearby', v.amenities.nearby],
  ];
  const lines: string[] = [];
  for (const [label, items] of groups) {
    if (items.length > 0) {
      lines.push(`- **${label}:** ${items.join('; ')}`);
    }
  }
  return lines.length > 0 ? ['## Services & amenities', '', ...lines] : [];
}

function dataQualitySection(v: VillaRecord): string[] {
  const lines = nonEmpty([
    `Research confidence: ${v.research.confidence} (last updated ${v.research.lastUpdated})`,
    v.research.sources.length > 0 ? `Research sources: ${v.research.sources.join('; ')}` : null,
  ]);
  const body: string[] = [...bullets(lines)];
  if (v.consolidation) {
    body.push(
      `- Consolidation status: ${v.consolidation.status}` +
        `${v.consolidation.updatedAt ? ` (updated ${v.consolidation.updatedAt})` : ''}`,
    );
    for (const gap of v.consolidation.gaps) {
      body.push(`  - ${gap}`);
    }
  }
  for (const conflict of v.conflicts ?? []) {
    body.push(
      `- Conflict ${conflict.id} (${conflict.field}): ${conflict.summary} Treatment: ${conflict.treatment}`,
    );
  }
  return body.length > 0 ? ['## Data quality & open conflicts', '', ...body] : [];
}

// ---------------------------------------------------------------------------
// Document assembly
// ---------------------------------------------------------------------------

function propertyIdOf(v: VillaRecord): string {
  return `re-${v.listingId}`;
}

function fileNameOf(v: VillaRecord): string {
  return `${propertyIdOf(v)}-${v.slug}.md`;
}

function renderVilla(v: VillaRecord): string {
  const propertyId = propertyIdOf(v);
  const sections: string[][] = [
    frontMatter(v, propertyId),
    [`# ${v.name}`, '', `> Canonical property id: \`${propertyId}\` · Source listing: <${v.sourceUrl}>`],
    descriptionSection(v),
    stayRulesSection(v),
    ratesSection(v),
    taxSection(v),
    valuationSection(v),
    costDefaultsSection(v),
    servicesAndAmenitiesSection(v),
    dataQualitySection(v),
  ];
  const body = sections
    .filter((section) => section.length > 0)
    .map((section) => section.join('\n'))
    .join('\n\n');
  return (
    `${body}\n\n` +
    '---\n' +
    '*Generated by rag/scripts/prepare-villa-docs.ts from docs/product/rebuild/ESTATE-24-DATA.json. ' +
    'Do not hand-edit; provenance labels are contractual.*\n'
  );
}

// ---------------------------------------------------------------------------
// Validation + main
// ---------------------------------------------------------------------------

function validate(villas: VillaRecord[]): void {
  if (!Array.isArray(villas) || villas.length === 0) {
    throw new Error(`Source ${SOURCE_PATH} did not parse into a non-empty array.`);
  }
  const seen = new Set<string>();
  for (const v of villas) {
    for (const field of ['listingId', 'name', 'slug'] as const) {
      if (typeof v[field] !== 'string' || v[field].length === 0) {
        throw new Error(`Record id=${v.id} is missing required field "${field}".`);
      }
    }
    const pid = propertyIdOf(v);
    if (seen.has(pid)) {
      throw new Error(`Duplicate property id "${pid}" — ids are contracts and must be unique.`);
    }
    seen.add(pid);
  }
  console.log(`[ok] ${villas.length} villa records validated (${seen.size} unique property ids).`);
}

function removeStaleGeneratedFiles(keep: Set<string>): void {
  if (!existsSync(OUT_DIR)) return;
  for (const file of readdirSync(OUT_DIR)) {
    if (GENERATED_FILE_PATTERN.test(file) && !keep.has(file)) {
      unlinkSync(join(OUT_DIR, file));
      console.log(`[clean] removed stale generated file ${file}`);
    }
  }
}

function main(): void {
  // Strip a potential BOM so JSON.parse never chokes on it.
  const raw = readFileSync(SOURCE_PATH, 'utf8').replace(/^\uFEFF/, '');
  const villas = JSON.parse(raw) as VillaRecord[];
  validate(villas);

  mkdirSync(OUT_DIR, { recursive: true });
  removeStaleGeneratedFiles(new Set(villas.map(fileNameOf)));

  for (const villa of villas) {
    const file = join(OUT_DIR, fileNameOf(villa));
    writeFileSync(file, renderVilla(villa), 'utf8');
    console.log(`[write] ${fileNameOf(villa)}`);
  }
  console.log(`[done] ${villas.length} villa documents written to ${OUT_DIR}`);
}

main();

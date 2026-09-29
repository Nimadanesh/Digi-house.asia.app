/**
 * build-ingestion.ts — deterministic ingestion build for the Fifi Knowledge Foundation.
 *
 * FIFI-05. Reads the validated corpus per rag/knowledge-base/ingestion/MANIFEST.md,
 * validates, normalizes, chunks, and emits ONE reproducible artifact:
 *   rag/build/fifi-knowledge-build.json
 *
 * Run from the repo root:
 *   node --experimental-strip-types rag/scripts/build-ingestion.ts
 *
 * Determinism contract (do not weaken):
 * - No timestamps, no randomness, no locale-dependent ordering, no absolute paths.
 * - Files enumerated sorted; chunks sorted by (docId, locale, ordinal).
 * - Chunk IDs = sha256(docId|locale|headingPath|ordinal), hex prefix — stable.
 * - Line endings normalized CRLF→LF; trailing whitespace trimmed per line.
 * - Identical input produces byte-identical output (verified by running twice).
 *
 * Ground rules encoded here (do not weaken):
 * - Include set mirrors MANIFEST.md (rule-based, documented below) — never a wildcard.
 * - Authority/provenance/status travel on EVERY chunk; nothing is flattened.
 * - Live values are never stored: static concept docs only (firewall enforced by
 *   manifest + validation; this script additionally fails on `status: BLOCKED`).
 * - Brand abstraction: documents never carry product identity; the build injects
 *   `platform` + per-locale display brand from rag/brand.json at build time.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..', '..');
const RAG_DIR = join(repoRoot, 'rag');
const KB_DIR = join(RAG_DIR, 'knowledge-base');
const OUT_DIR = join(RAG_DIR, 'build');
const OUT_FILE = join(OUT_DIR, 'fifi-knowledge-build.json');
const BRAND_PATH = join(RAG_DIR, 'brand.json');
const PROMPT_PATH = join(RAG_DIR, 'prompts', 'system-prompt.md');

// ---------------------------------------------------------------------------
// Manifest mirror (FIFI-05 §3): explicit include rules — keep in sync with
// rag/knowledge-base/ingestion/MANIFEST.md. Anything not matched is excluded.
// ---------------------------------------------------------------------------

const INCLUDE_RULES = [
  { dir: 'preamble', files: ['00-global-rules-and-provenance.md'] },
  { dir: 'product-docs', exclude: ['DOCUMENTS-TO-WRITE.md'] },
  { dir: 'app-guide', exclude: [] },
  { dir: 'glossary', exclude: [] },
  { dir: 'faq', exclude: [] },
  { dir: 'troubleshooting', exclude: [] },
  { dir: 'villas', pattern: /^re-\d+-.*\.md$/ },
] as const;

const VALID_STATUS = ['ACTIVE'];
const VALID_TIERS = ['1', '2'];
const VALID_PROV = ['OBSERVED', 'ESTIMATED', 'DERIVED', 'PROJECTED', 'UNKNOWN', 'CONFLICTED', 'MIXED'];
const VALID_RET = ['eligible', 'restricted', 'evidence-only', 'never'];
const VALID_AUTH = ['authoritative', 'explanation-only', 'evidence-only', 'none'];
const VALID_LOCALES = ['en', 'fa'];

// Docs whose answers REQUIRE runtime live data (curated, review on product change).
const REQUIRES_LIVE_DATA = new Set([
  'fifi.faq.faq.where-portfolio.v1',
  'fifi.faq.faq.where-earnings.v1',
  'fifi.glossary.glossary.earnings.v1',
  'fifi.glossary.glossary.portfolio.v1',
  'fifi.glossary.glossary.membership.v1',
  'fifi.glossary.glossary.transaction.v1',
  'fifi.glossary.glossary.withdrawal.v1',
  'fifi.product.app-guide.app-overview-and-navigation.v1',
  'fifi.product.app-guide.buying-shares-primary.v1',
  'fifi.product.app-guide.secondary-market-and-trading.v1',
  'fifi.product.app-guide.estate-page-tabs.v1',
  'fifi.guide.product-doc.how-to-use-the-app.v1',
  'fifi.product.product-doc.estate-page-structure.v1',
]);

// Docs carrying financial claims (restricted-handling hint for the future engine).
const FINANCIAL_PATTERN =
  /(withdrawal|fee|commission|economic-model|business-rules|projected|accrued|paid|earnings|rental-income|valuation|yield|investment)/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fail(message: string): never {
  throw new Error(`[build-ingestion] FATAL: ${message}`);
}

function sha16(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex').slice(0, 16);
}

function normalize(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trim() + '\n';
}

interface FrontMatter {
  fields: Record<string, string>;
  relatedDocIds: string[];
  entities: Array<{ kind: string; id: string }>;
}

function parseFrontMatter(content: string): { fm: FrontMatter; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) fail('document missing YAML front matter block');
  const fields: Record<string, string> = {};
  for (const line of (match as RegExpMatchArray)[1].split('\n')) {
    const kv = line.match(/^\s*([A-Za-z]+)\s*:\s*(.+?)\s*$/);
    if (kv) fields[kv[1]] = kv[2];
  }
  const raw = (match as RegExpMatchArray)[1] + '\n' + (match as RegExpMatchArray)[2];
  const relatedDocIds = [...new Set([...raw.matchAll(/fifi\.[a-z-]+\.[a-z-]+\.[a-z0-9-]+\.v\d+/g)].map((m) => m[0]))];
  const entities = [...raw.matchAll(/\{kind:\s*([^,}]+?)\s*,\s*id:\s*([^}]+?)\s*\}/g)].map((m) => ({
    kind: m[1].trim(),
    id: m[2].trim(),
  }));
  return { fm: { fields, relatedDocIds, entities }, body: normalize((match as RegExpMatchArray)[2]) };
}

interface Section {
  headingPath: string[];
  text: string;
}

/** Heading-aware split: one chunk per ## section (### stays inside), H1/intro folds into the first chunk. */
function splitSections(body: string, title: string): Section[] {
  const lines = body.split('\n');
  const raw: Section[] = [];
  let currentHeading = title;
  let current: string[] = [];
  const push = () => {
    const text = current.join('\n').trim();
    if (text.length > 0) raw.push({ headingPath: [title, currentHeading].filter((h, i, a) => a.indexOf(h) === i), text });
    current = [];
  };
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)\s*$/);
    const h1 = line.match(/^#\s+(.*)\s*$/);
    if (h2) {
      push();
      currentHeading = h2[1];
      current.push(line);
    } else if (h1) {
      current.push(line);
    } else {
      current.push(line);
    }
  }
  push();
  if (raw.length === 0) raw.push({ headingPath: [title], text: body.trim() });
  // Degenerate sections (heading with <40 chars of real content, e.g. a bare
  // H1 with no intro) carry no standalone meaning and flood ranking ties with
  // empty text. Merge each into the FOLLOWING section (heading kept as context);
  // a trailing degenerate merges into the previous one. Deterministic.
  const sections: Section[] = [];
  let pendingHeading: string | null = null;
  for (const section of raw) {
    const contentChars = section.text
      .split('\n')
      .filter((line) => !line.match(/^#{1,3}\s/))
      .join('\n')
      .trim().length;
    if (contentChars < 40) {
      pendingHeading = pendingHeading ?? section.headingPath[section.headingPath.length - 1];
      if (sections.length > 0 && raw.indexOf(section) === raw.length - 1) {
        const prev = sections[sections.length - 1];
        prev.text = `${prev.text}\n${section.text}`.trim();
      }
      continue;
    }
    if (pendingHeading !== null && !section.headingPath.includes(pendingHeading)) {
      section.headingPath = [section.headingPath[0], pendingHeading, ...section.headingPath.slice(1)];
    }
    pendingHeading = null;
    sections.push(section);
  }
  if (sections.length === 0 && raw.length > 0) {
    const merged = raw.map((s) => s.text).join('\n').trim();
    sections.push({ headingPath: [title], text: merged });
  }
  return sections;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface Chunk {
  chunkId: string;
  docId: string;
  domain: string;
  docType: string;
  locale: string;
  sourceTier: number;
  status: string;
  defaultProvenance: string;
  retrievalEligibility: string;
  answerAuthority: string;
  scopeClass: string;
  sensitivity: string;
  requiresLiveData: boolean;
  entities: Array<{ kind: string; id: string }>;
  relatedDocIds: string[];
  contextHints: string[];
  headingPath: string[];
  ordinal: number;
  platform: string;
  brandDisplay: string;
  brandMentioned: boolean;
  source: string;
  text: string;
}

function main(): void {
  const brand = JSON.parse(readFileSync(BRAND_PATH, 'utf8')) as {
    platformId: string;
    displayName: Record<string, string>;
  };
  if (!brand.platformId || !brand.displayName?.en) fail('rag/brand.json missing platformId/displayName.en');

  const chunks: Chunk[] = [];
  const seenDocIds = new Set<string>();
  let fileCount = 0;

  const sortedRules = [...INCLUDE_RULES];
  for (const rule of sortedRules) {
    const dir = join(KB_DIR, rule.dir);
    if (!existsSync(dir)) fail(`missing knowledge dir: ${rule.dir}`);
    const files = readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .filter((f) => {
        if ('files' in rule && rule.files) return (rule.files as readonly string[]).includes(f);
        if ('exclude' in rule && (rule.exclude as readonly string[]).includes(f)) return false;
        if ('pattern' in rule && rule.pattern) return (rule.pattern as RegExp).test(f);
        return true;
      })
      .sort();
    for (const file of files) {
      const rel = `rag/knowledge-base/${rule.dir}/${file}`;
      const raw = readFileSync(join(dir, file), 'utf8').replace(/^﻿/, '');
      const { fm, body } = parseFrontMatter(raw);
      const f = fm.fields;

      const isVilla = rule.dir === 'villas';
      const docId = isVilla ? `fifi.estate.villa.${f['propertyId']}.v1` : (f['docId'] ?? '');
      if (!docId) fail(`${rel}: missing docId`);
      if (!isVilla && seenDocIds.has(`${docId}|${f['locale']}`)) fail(`${rel}: duplicate docId+locale ${docId}|${f['locale']}`);
      seenDocIds.add(`${docId}|${f['locale']}`);

      const domain = isVilla ? 'estate' : (f['domain'] ?? '');
      const docType = isVilla ? 'villa' : (f['docType'] ?? '');
      const locale = isVilla ? 'en' : (f['locale'] ?? '');
      const tier = isVilla ? '2' : (f['sourceTier'] ?? '');
      const status = isVilla ? 'ACTIVE' : (f['status'] ?? '');
      const prov = isVilla ? 'MIXED' : (f['defaultProvenance'] ?? '');
      const ret = isVilla ? 'eligible' : (f['retrievalEligibility'] ?? '');
      const auth = isVilla ? 'authoritative' : (f['answerAuthority'] ?? '');
      if (!VALID_LOCALES.includes(locale)) fail(`${rel}: invalid locale ${locale}`);
      if (!VALID_STATUS.includes(status)) fail(`${rel}: non-ACTIVE status ${status} — excluded content must not be ingested`);
      if (!VALID_TIERS.includes(tier)) fail(`${rel}: invalid sourceTier ${tier}`);
      if (!VALID_PROV.includes(prov)) fail(`${rel}: invalid defaultProvenance ${prov}`);
      if (!VALID_RET.includes(ret)) fail(`${rel}: invalid retrievalEligibility ${ret}`);
      if (!VALID_AUTH.includes(auth)) fail(`${rel}: invalid answerAuthority ${auth}`);

      const title = isVilla ? (body.match(/^#\s+(.*)\s*$/m)?.[1] ?? file) : (f['title'] ?? file);
      const entities = isVilla
        ? [{ kind: 'property', id: f['propertyId'] ?? fail(`${rel}: villa missing propertyId`) }]
        : fm.entities;
      const relatedDocIds = fm.relatedDocIds.filter((id) => id !== docId).sort();
      const brandDisplay = brand.displayName[locale] ?? brand.displayName.en;
      const brandMentioned =
        body.includes(brand.displayName.en) || body.includes(brand.displayName.fa ?? '');
      const sensitivity =
        domain === 'economics' || FINANCIAL_PATTERN.test(docId) ? 'financial' : 'standard';

      const sections = splitSections(body, title);
      sections.forEach((section, i) => {
        const chunkId = `fifi-ch-${sha16(`${docId}|${locale}|${section.headingPath.join('>')}|${i}`)}`;
        chunks.push({
          chunkId,
          docId,
          domain,
          docType,
          locale,
          sourceTier: Number(tier),
          status,
          defaultProvenance: prov,
          retrievalEligibility: ret,
          answerAuthority: auth,
          scopeClass: 'general',
          sensitivity,
          requiresLiveData: REQUIRES_LIVE_DATA.has(docId),
          entities,
          relatedDocIds,
          contextHints: isVilla ? ['property'] : [],
          headingPath: section.headingPath,
          ordinal: i,
          platform: brand.platformId,
          brandDisplay,
          brandMentioned,
          source: rel,
          text: section.text,
        });
      });
      fileCount++;
    }
  }

  // Villa canonicality gate: exactly 24, unique propertyIds.
  const villaChunks = chunks.filter((c) => c.docType === 'villa');
  const villaDocs = new Set(villaChunks.map((c) => c.docId));
  if (villaDocs.size !== 24) fail(`expected 24 villa documents, found ${villaDocs.size}`);

  chunks.sort((a, b) =>
    a.docId < b.docId ? -1 : a.docId > b.docId ? 1 : a.locale < b.locale ? -1 : a.locale > b.locale ? 1 : a.ordinal - b.ordinal,
  );
  const chunkIds = new Set(chunks.map((c) => c.chunkId));
  if (chunkIds.size !== chunks.length) fail('duplicate chunk IDs — determinism broken');

  const promptText = normalize(readFileSync(PROMPT_PATH, 'utf8'));
  const artifact = {
    build: 'fifi-knowledge-build',
    version: 1,
    contracts: [
      'docs/FIFI-KNOWLEDGE-CONTRACT-V1.md',
      'docs/FIFI-KNOWLEDGE-SCHEMA-V1.md',
      'docs/FIFI-SCOPE-AND-SAFETY-CONTRACT-V1.md',
      'docs/FIFI-KNOWLEDGE-VALIDATION-V1.md',
    ],
    manifest: 'rag/knowledge-base/ingestion/MANIFEST.md',
    brand: {
      platform: brand.platformId,
      display: brand.displayName,
    },
    systemPrompt: {
      source: 'rag/prompts/system-prompt.md',
      sha256: createHash('sha256').update(promptText, 'utf8').digest('hex'),
      text: promptText,
    },
    stats: {
      files: fileCount,
      documents: seenDocIds.size,
      chunks: chunks.length,
      villaDocuments: villaDocs.size,
      locales: ['en', 'fa'],
    },
    chunks,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(artifact, null, 2) + '\n', 'utf8');
  console.log(`[done] ${fileCount} files → ${seenDocIds.size} documents → ${chunks.length} chunks → ${OUT_FILE}`);
}

main();

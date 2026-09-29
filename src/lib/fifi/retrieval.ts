// File responsibility: Fifi static-knowledge Retrieval Runtime (FIFI-07).
// Finds relevant approved chunks from the FIFI-05 deterministic build artifact.
// It NEVER generates answers, NEVER sources current values, NEVER executes actions.
// Ranking is deterministic and explainable; brand-neutral (no display-brand literals).
//
// Flow: DecisionEngine → Retrieval (this) → evidence (+ live-data handoff) → future Answer Layer.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  FifiCategory,
  FifiIntent,
  FifiLearningLevel,
  FifiScope,
} from "./decision-types";

/** Structured retrieval request. No filesystem/vector/embedding details leak here. */
export interface RetrievalRequest {
  query: string;
  locale: string;
  intent?: FifiIntent;
  category?: FifiCategory;
  scope?: FifiScope;
  /** Canonical property id (`re-*`) for context boosting. */
  propertyId?: string;
  route?: string;
  knowledgeRequirement?: "static" | "live" | "both" | "neither";
  learningLevel?: FifiLearningLevel;
  topK?: number;
}

/** One traceable evidence record. Full metadata — never plain text only. */
export interface RetrievalHit {
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
  sensitivity: string;
  entities: Array<{ kind: string; id: string }>;
  relatedDocIds: string[];
  headingPath: string[];
  source: string;
  text: string;
  /** Explainable score parts (internal; never user-facing). */
  score: number;
  scoreParts: Record<string, number>;
}

/** Live-data handoff: what the future Live Data Layer must still fetch. */
export interface LiveDataHandoff {
  required: boolean;
  category?: FifiCategory;
  /** True when a property context is needed but absent. */
  needsPropertyContext: boolean;
  /** True when authenticated user state is needed. */
  needsUserState: boolean;
}

export type EmptyReason =
  | "empty_query"
  | "scope_excluded"
  | "awaiting_clarification"
  | "no_match";

/** Structured retrieval result. */
export interface RetrievalResult {
  hits: RetrievalHit[];
  totalCandidates: number;
  liveData: LiveDataHandoff;
  emptyReason?: EmptyReason;
  deterministic: true;
}

/** Provider-independent retriever contract. */
export interface KnowledgeRetriever {
  readonly providerName: string;
  retrieve(request: RetrievalRequest): RetrievalResult;
}

// --- Tokenization (deterministic, bilingual) ---

const EN_STOP = new Set(
  "what,is,the,a,an,of,to,and,or,for,on,in,how,does,do,me,my,i,it,this,that,these,those,about,mean,means,meaning,can,you,your,with,from,where,when,there,here,are,was,were,be,do,does,by,at,as,which,who,whom,open,show,tell,give,find,see,check,much,many,does".split(","),
);
const FA_STOP = new Set(
  "چی,چیست,یعنی,به,از,در,را,رو,و,یا,برای,با,من,این,آن,چه,چطور,چگونه,کجا,کجاست,که,را,است,هست,می,های,ها,تر,ترین,کن,بکن,ببین,بگو,ده,درباره,مورد,طور,الان,فعلا".split(","),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 2 && !EN_STOP.has(t) && !FA_STOP.has(t))
    .map(stemWord);
}

/** Minimal stemmer: English trailing-s + conservative Persian suffix strip. */
export function stemWord(word: string): string {
  if (/[a-z]/.test(word)) {
    if (word.length > 4 && /[a-z]s$/.test(word) && !/[sus]s$/.test(word)) return word.slice(0, -1);
    return word;
  }
  // Persian: strip plural/possessive tails with a length floor so short
  // function words survive (query-side stopwords are filtered before stemming).
  if (word.length >= 4) {
    for (const suffix of ["مان", "تان", "شان", "های", "ها", "م", "ت", "ش", "ی"]) {
      if (word.endsWith(suffix) && word.length - suffix.length >= 3) return word.slice(0, -suffix.length);
    }
  }
  return word;
}

function haystackWords(haystack: string): Set<string> {
  return new Set(
    haystack
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((t) => t.length >= 2)
      .map(stemWord),
  );
}

function distinctHits(tokens: string[], haystack: string): string[] {
  const lower = haystack.toLowerCase();
  const words = haystackWords(haystack);
  return [
    ...new Set(
      tokens.filter((t) => (/[a-z]/.test(t) ? words.has(stemWord(t)) : lower.includes(t))),
    ),
  ];
}

// --- Scoring model (documented, explainable, deterministic) ---
// IDF-weighted lexical relevance + structural bonuses:
// propertyId-exact +1000 · context-property +500 · title-token +4×idf ·
// heading-token +2.5×idf · body-token +1×idf · locale +5 · tier1 +3 / tier2 +2 ·
// exact-phrase +15. Content hit required (bonuses alone never qualify).
// Matching is whole-word with a minimal trailing-s stemmer for Latin tokens
// (so "villas" finds "villa" but generic "work" never matches "works");
// non-Latin tokens match by substring. Ties prefer shorter, focused chunks.
// IDF is corpus-derived at construction: identical corpus → identical scores.

const DEFAULT_TOP_K = 5;
const PROPERTY_ID_RE = /re-\d+/;

interface IndexedChunk {
  chunk: Record<string, unknown>;
  titleText: string;
  headingText: string;
  bodyText: string;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export interface RetrievalBuild {
  chunks: Record<string, unknown>[];
}

export function loadRetrievalBuild(): RetrievalBuild {
  const here = dirname(fileURLToPath(import.meta.url));
  const path = join(here, "..", "..", "..", "rag", "build", "fifi-knowledge-build.json");
  return JSON.parse(readFileSync(path, "utf8")) as RetrievalBuild;
}

const USER_STATE_CATEGORIES: ReadonlySet<string> = new Set([
  "income",
  "ownership",
  "withdrawal",
  "troubleshooting",
  "account",
]);

/** Deterministic build-backed retriever. Pure apart from construction input. */
export class BuildRetriever implements KnowledgeRetriever {
  readonly providerName = "build-lexical-v1";
  private readonly index: IndexedChunk[];
  private readonly docFreq: Map<string, number>;
  private readonly corpusSize: number;

  constructor(build: RetrievalBuild) {
    this.index = [...(build.chunks ?? [])]
      .sort((a, b) => {
        const da = asString(a["docId"]);
        const db = asString(b["docId"]);
        if (da !== db) return da < db ? -1 : 1;
        const la = asString(a["locale"]);
        const lb = asString(b["locale"]);
        if (la !== lb) return la < lb ? -1 : 1;
        return Number(a["ordinal"] ?? 0) - Number(b["ordinal"] ?? 0);
      })
      .map((chunk) => ({
        chunk,
        titleText: asStringArray(chunk["headingPath"])[0] ?? "",
        headingText: asStringArray(chunk["headingPath"]).slice(1).join(" "),
        bodyText: asString(chunk["text"]),
      }));
    this.corpusSize = this.index.length;
    // Document frequencies over the same tokenization (sorted iteration = stable).
    this.docFreq = new Map<string, number>();
    for (const entry of this.index) {
      const terms = new Set(tokenize(`${entry.titleText} ${entry.headingText} ${entry.bodyText}`));
      for (const term of [...terms].sort()) {
        this.docFreq.set(term, (this.docFreq.get(term) ?? 0) + 1);
      }
    }
  }

  private idf(term: string): number {
    const df = this.docFreq.get(term) ?? 1;
    return Math.log(this.corpusSize / df);
  }

  retrieve(request: RetrievalRequest): RetrievalResult {
    const query = request.query.trim();
    const topK = request.topK ?? DEFAULT_TOP_K;
    const noLive: LiveDataHandoff = { required: false, needsPropertyContext: false, needsUserState: false };

    if (query.length === 0) {
      return { hits: [], totalCandidates: 0, liveData: noLive, emptyReason: "empty_query", deterministic: true };
    }
    if (request.scope === "never_disclose_or_perform" || request.scope === "out_of_scope") {
      return { hits: [], totalCandidates: 0, liveData: noLive, emptyReason: "scope_excluded", deterministic: true };
    }
    if (request.knowledgeRequirement === "neither") {
      return { hits: [], totalCandidates: 0, liveData: noLive, emptyReason: "awaiting_clarification", deterministic: true };
    }

    const tokens = tokenize(query);
    const queryIds = [...new Set([...query.toLowerCase().matchAll(/re-\d+/g)].map((m) => m[0]))];
    const phrase = tokens.join(" ");
    const liveRequired = request.knowledgeRequirement === "live" || request.knowledgeRequirement === "both";

    const scored: RetrievalHit[] = [];
    for (const entry of this.index) {
      const c = entry.chunk;
      // Corpus firewall: only eligible, active, Tier<=2 records are indexed inputs;
      // re-verify defensively (never trust upstream silently).
      if (c["retrievalEligibility"] !== "eligible" || c["status"] !== "ACTIVE") continue;
      if (Number(c["sourceTier"] ?? 99) > 2) continue;

      const entities = Array.isArray(c["entities"])
        ? (c["entities"] as Array<Record<string, unknown>>)
        : [];
      const entityIds = entities.map((e) => String(e["id"] ?? ""));
      const parts: Record<string, number> = {};
      const titleHits = distinctHits(tokens, entry.titleText);
      const headingHits = distinctHits(tokens, entry.headingText).filter((t) => !titleHits.includes(t));
      const bodyHits = distinctHits(tokens, entry.bodyText).filter(
        (t) => !titleHits.includes(t) && !headingHits.includes(t),
      );
      if (titleHits.length + headingHits.length + bodyHits.length === 0) continue;

      const round2 = (n: number): number => Math.round(n * 100) / 100;
      parts.title = round2(titleHits.reduce((sum, t) => sum + 4 * this.idf(t), 0));
      parts.heading = round2(headingHits.reduce((sum, t) => sum + 2.5 * this.idf(t), 0));
      parts.body = round2(bodyHits.reduce((sum, t) => sum + this.idf(t), 0));
      // Single-token queries are term lookups: prefer definition documents
      // (glossary/faq) whose TITLE is about the term — not every doc that
      // merely mentions it. Deterministic, documented.
      if (tokens.length === 1 && titleHits.length > 0) {
        const dt = asString(c["docType"]);
        if (dt === "glossary" || dt === "faq") parts.definition = 6;
      }
      if (phrase.length > 3 && entry.bodyText.toLowerCase().includes(phrase)) parts.phrase = 15;
      if (queryIds.some((id) => entityIds.includes(id))) parts.propertyExact = 1000;
      if (request.propertyId && entityIds.includes(request.propertyId)) parts.contextProperty = 500;
      if (asString(c["locale"]) === request.locale) parts.locale = 5;
      parts.authority = Number(c["sourceTier"]) === 1 ? 3 : 2;

      const score = Object.values(parts).reduce((a, b) => a + b, 0);
      scored.push({
        chunkId: asString(c["chunkId"]),
        docId: asString(c["docId"]),
        domain: asString(c["domain"]),
        docType: asString(c["docType"]),
        locale: asString(c["locale"]),
        sourceTier: Number(c["sourceTier"]),
        status: asString(c["status"]),
        defaultProvenance: asString(c["defaultProvenance"]),
        retrievalEligibility: asString(c["retrievalEligibility"]),
        answerAuthority: asString(c["answerAuthority"]),
        sensitivity: asString(c["sensitivity"]),
        entities: entities.map((e) => ({ kind: String(e["kind"] ?? ""), id: String(e["id"] ?? "") })),
        relatedDocIds: asStringArray(c["relatedDocIds"]),
        headingPath: asStringArray(c["headingPath"]),
        source: asString(c["source"]),
        text: entry.bodyText,
        score,
        scoreParts: parts,
      });
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Focused (shorter) chunks win ties: a single-topic section outranks a
      // long document that merely mentions the terms in a shared title.
      if (a.text.length !== b.text.length) return a.text.length - b.text.length;
      if (a.docId !== b.docId) return a.docId < b.docId ? -1 : 1;
      if (a.locale !== b.locale) return a.locale < b.locale ? -1 : 1;
      return 0;
    });

    const hits = scored.slice(0, Math.max(1, topK));
    const liveData: LiveDataHandoff = liveRequired
      ? {
          required: true,
          category: request.category,
          needsPropertyContext:
            (request.category === "estate" || PROPERTY_ID_RE.test(query)) && !request.propertyId && queryIds.length === 0,
          needsUserState: request.category !== undefined && USER_STATE_CATEGORIES.has(request.category),
        }
      : noLive;

    return {
      hits,
      totalCandidates: scored.length,
      liveData,
      emptyReason: hits.length === 0 ? "no_match" : undefined,
      deterministic: true,
    };
  }
}

let cached: BuildRetriever | null = null;

/** Load-once accessor (documents the caching assumption: build file is immutable at runtime). */
export function getDefaultRetriever(): KnowledgeRetriever {
  if (!cached) cached = new BuildRetriever(loadRetrievalBuild());
  return cached;
}

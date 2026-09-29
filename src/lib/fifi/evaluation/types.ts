// File responsibility: Fifi evaluation CONTRACTS (FIFI-10). Deterministic,
// repeatable benchmark over the real DecisionEngine + Retriever + LiveData +
// Orchestrator. No LLM, no Laya, no network. Uses existing enums only.

/** Stable case identity. Never renamed once published. */
export type EvalCaseId = string;

export interface EvalContext {
  propertyId?: string;
  route?: string;
  locale: string;
  subject: "auth" | "anon";
}

export interface EvalExpectations {
  intent?: string;
  category?: string;
  scope?: string;
  knowledgeRequirement?: "static" | "live" | "both" | "neither";
  needsClarification?: boolean;
  learningLevel?: string;
  /** Substrings expected in ≥1 retrieved docId (Hit@K over topK hits). */
  docIdContains?: string[];
  /** Substrings that must NOT appear in any retrieved docId. */
  docIdAbsent?: string[];
  /** Top-hit locale expectation. */
  topLocale?: string;
  minHits?: number;
  /** Live capabilities the trace must include. */
  liveCapabilities?: string[];
  /** All attempted live lookups must succeed. */
  liveOk?: boolean;
  responseStatus?: string;
  /** Expected next-step kind. */
  nextStepKind?: string;
  /** Expected navigation action present in response actions. */
  expectedAction?: string;
  /** Literal substrings that must appear in the answer (stable templates only). */
  mustContain?: string[];
  /** Literal substrings/patterns that must NOT appear in the answer. */
  mustNotContain?: string[];
  /** Provenance label expected in ≥1 source. */
  provenanceInSources?: string;
}

export interface EvalCase {
  id: EvalCaseId;
  locale: string;
  question: string;
  context?: Partial<EvalContext>;
  expect: EvalExpectations;
  notes?: string;
}

export interface CaseCheck {
  name: string;
  pass: boolean;
  expected?: string;
  actual?: string;
}

export interface CaseResult {
  id: EvalCaseId;
  pass: boolean;
  checks: CaseCheck[];
  fingerprint: string;
}

export interface EvalMetrics {
  routing: { pass: number; total: number; failed: string[] };
  retrieval: { pass: number; total: number; failed: string[] };
  grounding: { pass: number; total: number; failed: string[] };
  staticLive: { pass: number; total: number; failed: string[] };
  safety: { pass: number; total: number; failed: string[] };
  clarification: { pass: number; total: number; failed: string[] };
  nextStep: { pass: number; total: number; failed: string[] };
  security: { pass: number; total: number; failed: string[] };
  persian: { pass: number; total: number; failed: string[] };
}

export interface EvalReport {
  version: 1;
  suite: string;
  caseCount: number;
  metrics: EvalMetrics;
  failedCaseIds: string[];
  results: CaseResult[];
}

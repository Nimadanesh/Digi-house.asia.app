// File responsibility: Fifi answer/orchestration CONTRACTS (FIFI-09).
// Evidence vs generated answer stay structurally distinct. User-safe response
// carries no scores, internals, secrets, or system instructions. Brand-neutral.

import type {
  FifiCategory,
  FifiIntent,
  FifiLearningLevel,
  FifiNavigationAction,
  FifiScope,
} from "./decision-types";
import type { RetrievalHit } from "./retrieval";
import type {
  DataSource,
  LiveCapability,
  LiveDataErrorCode,
  LiveProvenance,
} from "./live-data";

/** Assembled evidence. Sources never merge into one blob. */
export interface FifiEvidence {
  knowledge: RetrievalHit[];
  live: LiveEvidence[];
  context: { route?: string; propertyId?: string; screenContext?: string };
  navigation?: FifiNavigationAction;
}

export interface LiveEvidence {
  capability: LiveCapability;
  ok: boolean;
  /** Repo-native data on success; absent on failure. */
  data?: unknown;
  provenance?: LiveProvenance;
  currentness?: string;
  source?: DataSource;
  errorCode?: LiveDataErrorCode;
}

/** Structured next step. Never a dead end. */
export interface FifiNextStep {
  kind: "answer" | "clarify" | "navigate" | "retry" | "redirect" | "unavailable";
  /** Short user-facing text in the response locale. */
  text: string;
  action?: FifiNavigationAction;
}

/** User-safe Fifi response contract. */
export interface FifiResponse {
  /** Natural-language answer in the response locale. */
  answer: string;
  locale: string;
  status: "resolved" | "clarification_required" | "unavailable" | "out_of_scope" | "error";
  scope: FifiScope;
  intent: FifiIntent;
  category: FifiCategory;
  /** Traceable source refs (doc/chunk IDs stay internal-safe: IDs, not prose). */
  sources: Array<{
    kind: "knowledge" | "live" | "context";
    ref: string;
    provenance?: string;
    /** Live lookups only: whether the capability succeeded. */
    ok?: boolean;
  }>;
  needsClarification: boolean;
  clarification?: string;
  actions: FifiNavigationAction[];
  nextStep: FifiNextStep;
  learningLevel: FifiLearningLevel;
  /** Who generated the prose. Mock output is never production truth. */
  answerOrigin: "mock-template" | "model";
  /** Null unless the provider asserts a calibrated value. */
  confidence: "high" | "medium" | "low" | null;
}

/** Internal trace. Never user-facing; safe metadata only. */
export interface OrchestrationTrace {
  decisionSource: string;
  intent: FifiIntent;
  category: FifiCategory;
  scope: FifiScope;
  knowledgeRequirement: string;
  retrievalHits: number;
  liveCapabilities: LiveCapability[];
  providerName: string;
  providerStatus: "ok" | "fallback" | "error";
}

export interface OrchestratedResult {
  response: FifiResponse;
  trace: OrchestrationTrace;
}

// File responsibility: Fifi DecisionEngine CONTRACTS (FIFI-06). Structured
// decision types for routing user requests. The orchestration/answer layer depends
// on these interfaces — never directly on a model provider (Laya or otherwise).
// Brand-neutral by rule: no display-brand literals here (see lib/fifi/brand.ts).

/** Stable internal product identity. Never a display brand string. */
export const PLATFORM_ID = "platform" as const;

/** What Fifi should DO with a request. Controlled enum — never free text. */
export type FifiIntent =
  | "explain"
  | "learn"
  | "navigate"
  | "troubleshoot"
  | "retrieve_live_data"
  | "clarify"
  | "restricted"
  | "out_of_scope";

/** Internal routing domain. Never shown to users as an assistant choice. */
export type FifiCategory =
  | "product"
  | "estate"
  | "ownership"
  | "income"
  | "withdrawal"
  | "card"
  | "club"
  | "referral"
  | "terminology"
  | "account"
  | "troubleshooting"
  | "safety_trust"
  | "other";

/** Scope routing per the FIFI-03A safety contract. */
export type FifiScope = "in_scope" | "restricted" | "out_of_scope" | "never_disclose_or_perform";

/** Learning level. `unspecified` keeps the model extensible beyond 3 levels. */
export type FifiLearningLevel = "beginner" | "intermediate" | "advanced" | "unspecified";

/** Where the decision came from. Internal only — never user-facing. */
export type DecisionSource = "deterministic" | "model" | "hybrid" | "fallback";

/** Structured navigation instruction. Never a raw URL. */
export interface FifiNavigationAction {
  /** Canonical action identifier, e.g. `action.open-estate`. */
  actionId: string;
  /** Action parameters, e.g. `{ propertyId: "re-128862" }`. */
  params?: Record<string, string>;
}

/** Structured input to the DecisionEngine. Minimum necessary context only. */
export interface DecisionInput {
  /** Raw user message. */
  message: string;
  /** BCP-47-ish locale code, e.g. `en`, `fa`. */
  locale: string;
  /** Current app route, e.g. `/property/re-128862`. Omitted when unknown. */
  route?: string;
  /** Canonical property id (`re-*`) when the user is viewing an estate. */
  propertyId?: string;
  /** Opaque screen/context label, e.g. `estate-detail`. Never sensitive data. */
  screenContext?: string;
  /** `authenticated` | `anonymous` | `unknown`. Never tokens or initData. */
  authState?: "authenticated" | "anonymous" | "unknown";
  /** Prior turns (plain text) for continuity. Bounded by the caller. */
  conversationContext?: string[];
  /** Caller-provided learning signal, if known. */
  learningSignal?: FifiLearningLevel;
}

/** Structured decision. Consumed by orchestration/retrieval/answer layers. */
export interface FifiDecision {
  intent: FifiIntent;
  category: FifiCategory;
  scope: FifiScope;
  /** Whether static KB, live data, both, or neither is required. */
  knowledgeRequirement: "static" | "live" | "both" | "neither";
  /** True when the answer layer must ask a follow-up first. */
  needsClarification: boolean;
  /** Machine-readable clarification reason, e.g. `ambiguous_property`. */
  clarificationReason?: string;
  /** Navigation instruction, when navigation is the right path. */
  navigation?: FifiNavigationAction;
  learningLevel: FifiLearningLevel;
  /** Nearest useful alternative for restricted/out-of-scope/clarify paths. */
  nextStepHint?: string;
  /** How this decision was produced. */
  source: DecisionSource;
  /** Safe fallback marker. Normal decisions carry `none`. */
  fallback?: "none" | "low_confidence" | "provider_unavailable" | "provider_error";
}

/** A decision the engine can always return instead of inventing a category. */
export function safeFallbackDecision(reason: FifiDecision["fallback"] = "low_confidence"): FifiDecision {
  return {
    intent: "clarify",
    category: "other",
    scope: "in_scope",
    knowledgeRequirement: "static",
    needsClarification: true,
    clarificationReason: "ambiguous_request",
    learningLevel: "unspecified",
    nextStepHint: "ask_what_to_help_with",
    source: "fallback",
    fallback: reason,
  };
}

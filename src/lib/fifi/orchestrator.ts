// File responsibility: Fifi AnswerOrchestrator (FIFI-09).
// Coordinates DecisionEngine → KnowledgeRetriever → LiveDataProvider →
// AnswerProvider without duplicating any of their logic. The orchestrator owns
// sequencing, evidence assembly, and failure semantics — never prose, never URLs,
// never guesses. Brand-neutral (display copy arrives via options).

import type { AnswerProvider } from "./answer-provider";
import type {
  FifiEvidence,
  LiveEvidence,
  OrchestratedResult,
} from "./answer-types";
import type { DecisionEngine } from "./decision-engine";
import type { FifiCategory, FifiIntent } from "./decision-types";
import type { LiveCapability, LiveDataProvider, LiveSubject } from "./live-data";
import type { KnowledgeRetriever } from "./retrieval";

/** Orchestrator input. Authorized subject only — no credentials of any kind. */
export interface OrchestratorInput {
  question: string;
  locale: string;
  route?: string;
  propertyId?: string;
  screenContext?: string;
  subject: LiveSubject;
  conversationContext?: string[];
}

export interface OrchestratorDeps {
  engine: DecisionEngine;
  retriever: KnowledgeRetriever;
  liveData: LiveDataProvider;
  answerProvider: AnswerProvider;
  /** Display brand for user-facing copy (rag/brand.json at the composition root). */
  brandDisplay: string;
}

/** Category → live capabilities needed for retrieve_live_data decisions. */
const CATEGORY_CAPABILITIES: Readonly<Record<string, readonly LiveCapability[]>> = {
  income: ["earnings.current", "earnings.history"],
  ownership: ["portfolio.summary", "portfolio.holdings"],
  withdrawal: ["withdrawal.status"],
  troubleshooting: ["transaction.status"],
  estate: ["estate.current"],
  club: ["membership.status"],
  referral: ["referral.status"],
};

function capabilitiesFor(category: FifiCategory, intent: FifiIntent): LiveCapability[] {
  if (intent !== "retrieve_live_data") return [];
  return [...(CATEGORY_CAPABILITIES[category] ?? [])];
}

/** Single global entry point for asking Fifi. */
export async function askFifi(input: OrchestratorInput, deps: OrchestratorDeps): Promise<OrchestratedResult> {
  const decision = await deps.engine.decide({
    message: input.question,
    locale: input.locale,
    route: input.route,
    propertyId: input.propertyId,
    screenContext: input.screenContext,
    authState: input.subject.kind === "authenticated-user" ? "authenticated" : "anonymous",
    conversationContext: input.conversationContext,
  });

  // Retrieval: only when static evidence can help; scope/neither gates enforced inside.
  const needsStatic =
    decision.knowledgeRequirement === "static" || decision.knowledgeRequirement === "both";
  const retrieval = needsStatic
    ? deps.retriever.retrieve({
        query: input.question,
        locale: input.locale,
        intent: decision.intent,
        category: decision.category,
        scope: decision.scope,
        propertyId: input.propertyId,
        route: input.route,
        knowledgeRequirement: decision.knowledgeRequirement,
        learningLevel: decision.learningLevel,
      })
    : null;

  // Live data: only for mapped capabilities; failures preserved structurally.
  const live: LiveEvidence[] = [];
  for (const capability of capabilitiesFor(decision.category, decision.intent)) {
    const needsProperty =
      capability === "estate.current" || capability === "order.status";
    if (needsProperty && !input.propertyId) continue;
    try {
      const res = await deps.liveData.fetch({
        capability,
        propertyId: input.propertyId,
        locale: input.locale,
      });
      if (res.ok) {
        live.push({
          capability,
          ok: true,
          data: res.data,
          provenance: res.provenance,
          currentness: res.currentness,
          source: res.source,
        });
      } else {
        live.push({ capability, ok: false, errorCode: res.code });
      }
    } catch {
      live.push({ capability, ok: false, errorCode: "source_error" });
    }
  }

  const evidence: FifiEvidence = {
    knowledge: retrieval?.hits ?? [],
    live,
    context: { route: input.route, propertyId: input.propertyId, screenContext: input.screenContext },
    navigation: decision.navigation,
  };

  let response;
  let providerStatus: "ok" | "fallback" | "error" = "ok";
  try {
    const produced = await deps.answerProvider.generate({
      question: input.question,
      locale: input.locale,
      decision,
      evidence,
      brandDisplay: deps.brandDisplay,
    });
    response = sanitizeResponse(produced);
    if (response === null) {
      providerStatus = "fallback";
      response = fallbackResponse(input, decision.navigation);
    }
  } catch {
    providerStatus = "error";
    response = fallbackResponse(input, decision.navigation);
  }

  return {
    response,
    trace: {
      decisionSource: decision.source,
      intent: decision.intent,
      category: decision.category,
      scope: decision.scope,
      knowledgeRequirement: decision.knowledgeRequirement,
      retrievalHits: evidence.knowledge.length,
      liveCapabilities: live.map((l) => l.capability),
      providerName: deps.answerProvider.providerName,
      providerStatus,
    },
  };
}

function fallbackResponse(
  input: OrchestratorInput,
  navigation?: OrchestratedResult["response"]["actions"][number],
): OrchestratedResult["response"] {
  const fa = input.locale.toLowerCase().startsWith("fa");
  const text = fa ? "مشکلی پیش آمد؛ لطفاً دوباره بپرسید." : "Something went wrong; please ask again.";
  return {
    answer: text,
    locale: input.locale,
    status: "error",
    scope: "in_scope",
    intent: "clarify",
    category: "other",
    sources: [],
    needsClarification: false,
    actions: navigation ? [navigation] : [],
    nextStep: { kind: "retry", text },
    learningLevel: "unspecified",
    answerOrigin: "mock-template",
    confidence: null,
  };
}

/** Validate provider output shape; null means "use structured fallback". */
function sanitizeResponse(produced: unknown): OrchestratedResult["response"] | null {
  if (!produced || typeof produced !== "object") return null;
  const r = produced as Record<string, unknown>;
  if (typeof r["answer"] !== "string" || r["answer"].length === 0) return null;
  if (typeof r["status"] !== "string") return null;
  if (!Array.isArray(r["actions"]) || typeof r["nextStep"] !== "object" || r["nextStep"] === null) {
    return null;
  }
  const next = r["nextStep"] as Record<string, unknown>;
  if (typeof next["kind"] !== "string" || typeof next["text"] !== "string") return null;
  return produced as OrchestratedResult["response"];
}

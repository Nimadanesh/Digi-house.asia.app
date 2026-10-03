// File responsibility: Laya-backed DecisionEngine provider (FIFI-06).
// Implements the SAME `DecisionEngine` interface as the rule-based engine so Laya
// (or any future model) stays replaceable without touching Fifi orchestration:
//   Fifi → DecisionEngine → LayaDecisionEngine
// Server-side only: reads `FIFI_LAYA_ENDPOINT` (+ optional `FIFI_LAYA_API_KEY`).
// The endpoint is parsed once at module load and accepted only as an https URL
// without embedded credentials (SSRF hardening): a misconfigured or non-https
// value is treated as unconfigured, keeping the deterministic fallback. When
// unconfigured, the engine transparently delegates to the deterministic engine
// and reports source `fallback`. No model weights are bundled; no new
// dependencies (fetch only). $0-compatible: nothing is called unless configured.

import type {
  DecisionInput,
  FifiDecision,
} from "./decision-types";
import type { DecisionEngine } from "./decision-engine";
import { RuleBasedDecisionEngine } from "./rule-engine";

/**
 * https-only endpoint parse (SSRF hardening). The URL is operator-supplied
 * configuration, never user input; accepting only https without embedded
 * credentials keeps the outgoing request pinned to an explicit secure origin.
 * Null → provider treated as unconfigured (deterministic fallback).
 */
function safeEndpointUrl(raw: string): URL | null {
  if (raw.length === 0) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.username === "" && url.password === ""
      ? url
      : null;
  } catch {
    return null;
  }
}

const ENDPOINT_URL = safeEndpointUrl(process.env.FIFI_LAYA_ENDPOINT ?? "");
/** Resolved once at load: `${origin+path}/decide`. Null when unconfigured. */
const DECIDE_URL =
  ENDPOINT_URL !== null ? new URL("/decide", ENDPOINT_URL) : null;
const API_KEY = process.env.FIFI_LAYA_API_KEY ?? "";

/** Minimal shape of a Laya typed-decision response (mapped, never trusted blindly). */
interface LayaRawDecision {
  intent?: unknown;
  category?: unknown;
  needs_live_data?: unknown;
  needs_clarification?: unknown;
  navigation_action?: unknown;
  learning_level?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export class LayaDecisionEngine implements DecisionEngine {
  readonly providerName = "laya-v1";
  private readonly fallback = new RuleBasedDecisionEngine();

  /** True when a self-hosted Laya endpoint is configured (https, no credentials). */
  static isConfigured(): boolean {
    return DECIDE_URL !== null;
  }

  async decide(input: DecisionInput): Promise<FifiDecision> {
    if (DECIDE_URL === null) {
      const decision = this.fallback.decide(input);
      return { ...decision, source: "fallback", fallback: "provider_unavailable" };
    }
    try {
      const response = await fetch(DECIDE_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(API_KEY.length > 0 ? { authorization: `Bearer ${API_KEY}` } : {}),
        },
        body: JSON.stringify({
          message: input.message,
          locale: input.locale,
          route: input.route ?? null,
          property_id: input.propertyId ?? null,
          screen_context: input.screenContext ?? null,
        }),
      });
      if (!response.ok) throw new Error(`laya_http_${response.status}`);
      const raw: unknown = await response.json();
      if (!isRecord(raw)) throw new Error("laya_malformed");
      return this.mapRaw(raw as LayaRawDecision, input);
    } catch {
      const decision = this.fallback.decide(input);
      return { ...decision, source: "fallback", fallback: "provider_error" };
    }
  }

  /**
   * Map untrusted model output onto the controlled contract. Unknown values fall
   * back to the deterministic engine's decision for the same input — the model
   * can never invent an intent, category, or scope outside the enums.
   */
  private mapRaw(raw: LayaRawDecision, input: DecisionInput): FifiDecision {
    const fallback = this.fallback.decide(input);
    const asIntent = typeof raw.intent === "string" ? raw.intent : "";
    const asCategory = typeof raw.category === "string" ? raw.category : "";
    const validIntents = new Set([
      "explain",
      "learn",
      "navigate",
      "troubleshoot",
      "retrieve_live_data",
      "clarify",
      "restricted",
      "out_of_scope",
    ]);
    const validCategories = new Set([
      "product",
      "estate",
      "ownership",
      "income",
      "withdrawal",
      "card",
      "club",
      "referral",
      "terminology",
      "account",
      "troubleshooting",
      "safety_trust",
      "other",
    ]);
    return {
      ...fallback,
      intent: (validIntents.has(asIntent) ? asIntent : fallback.intent) as FifiDecision["intent"],
      category: (validCategories.has(asCategory) ? asCategory : fallback.category) as FifiDecision["category"],
      knowledgeRequirement:
        raw.needs_live_data === true
          ? "live"
          : raw.needs_live_data === false
            ? "static"
            : fallback.knowledgeRequirement,
      needsClarification:
        typeof raw.needs_clarification === "boolean" ? raw.needs_clarification : fallback.needsClarification,
      source: "model",
      fallback: "none",
    };
  }
}

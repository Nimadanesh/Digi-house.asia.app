// File responsibility: Fifi DecisionEngine INTERFACE + provider factory (FIFI-06).
// Fifi orchestration depends on `DecisionEngine`, never on a provider directly:
//   Fifi → DecisionEngine → provider (rule-based default, Laya behind the same interface)
// The engine decides WHAT should happen; it never generates the final answer.

import type { DecisionInput, FifiDecision } from "./decision-types";
import { safeFallbackDecision } from "./decision-types";

export type { DecisionInput, FifiDecision };

/** Provider-independent decision contract. All methods are pure and side-effect free. */
export interface DecisionEngine {
  /** Stable provider name for observability, e.g. `rule-based-v1`, `laya-v1`. */
  readonly providerName: string;
  /** Classify one user request into a structured decision. Never throws. */
  decide(input: DecisionInput): Promise<FifiDecision> | FifiDecision;
}

export type DecisionProvider = "rule-based" | "laya";

/** Build a DecisionEngine. Default is the deterministic rule-based provider. */
export async function createDecisionEngine(
  provider: DecisionProvider = "rule-based",
): Promise<DecisionEngine> {
  if (provider === "laya") {
    const { LayaDecisionEngine } = await import("./laya-engine");
    return new LayaDecisionEngine();
  }
  const { RuleBasedDecisionEngine } = await import("./rule-engine");
  return new RuleBasedDecisionEngine();
}

/** Wrap any engine so a failure can never produce arbitrary behavior. */
export function withSafeFallback(engine: DecisionEngine): DecisionEngine {
  return {
    providerName: `${engine.providerName}+safe-fallback`,
    async decide(input: DecisionInput): Promise<FifiDecision> {
      try {
        const decision = await engine.decide(input);
        if (!decision || typeof decision.intent !== "string") return safeFallbackDecision("provider_error");
        return { fallback: "none", ...decision } as FifiDecision;
      } catch {
        return safeFallbackDecision("provider_error");
      }
    },
  };
}

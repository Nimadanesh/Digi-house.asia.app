// File responsibility: Fifi evaluation dataset index + validation (FIFI-10).
// 82 cases. validateDataset enforces: unique IDs, known enums, required fields.
import type { EvalCase } from "./types";
import { PRODUCT_CASES, ESTATE_CASES } from "./cases-1";
import { ECONOMICS_CASES, LIVE_CASES, NAV_CASES } from "./cases-2";
import { FA_TERM_CASES, AMBIGUOUS_CASES, ADVERSARIAL_CASES } from "./cases-3";

export const ALL_CASES: EvalCase[] = [
  ...PRODUCT_CASES,
  ...ESTATE_CASES,
  ...ECONOMICS_CASES,
  ...LIVE_CASES,
  ...NAV_CASES,
  ...FA_TERM_CASES,
  ...AMBIGUOUS_CASES,
  ...ADVERSARIAL_CASES,
];

const KNOWN_INTENTS = new Set([
  "explain", "learn", "navigate", "troubleshoot", "retrieve_live_data", "clarify", "restricted", "out_of_scope",
]);
const KNOWN_SCOPES = new Set(["in_scope", "restricted", "out_of_scope", "never_disclose_or_perform"]);
const KNOWN_DATA_MODES = new Set(["static", "live", "both", "neither"]);

/** Validate the dataset itself. Throws on the first defect. */
export function validateDataset(cases: EvalCase[] = ALL_CASES): void {
  const seen = new Set<string>();
  for (const c of cases) {
    if (!c.id || !c.question || !c.locale) throw new Error(`malformed case: ${JSON.stringify(c).slice(0, 80)}`);
    if (seen.has(c.id)) throw new Error(`duplicate case id: ${c.id}`);
    seen.add(c.id);
    const e = c.expect;
    if (e.intent !== undefined && !KNOWN_INTENTS.has(e.intent)) throw new Error(`${c.id}: unknown intent ${e.intent}`);
    if (e.scope !== undefined && !KNOWN_SCOPES.has(e.scope)) throw new Error(`${c.id}: unknown scope ${e.scope}`);
    if (e.knowledgeRequirement !== undefined && !KNOWN_DATA_MODES.has(e.knowledgeRequirement)) {
      throw new Error(`${c.id}: unknown data mode ${e.knowledgeRequirement}`);
    }
    if (e.nextStepKind !== undefined && !["answer", "clarify", "navigate", "retry", "redirect", "unavailable"].includes(e.nextStepKind)) {
      throw new Error(`${c.id}: unknown nextStepKind ${e.nextStepKind}`);
    }
  }
}

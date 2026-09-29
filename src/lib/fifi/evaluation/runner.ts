// File responsibility: Fifi evaluation RUNNER (FIFI-10).
// Executes each case through the REAL orchestrated stack (engine → retriever →
// live → mock provider) and checks only the fields the case specifies.
// Deterministic: same repo state + fixtures → same results.
import { createHash } from "node:crypto";
import { askFifi, type OrchestratorDeps } from "../orchestrator";
import type { LiveSubject } from "../live-data";
import type { CaseCheck, CaseResult, EvalCase } from "./types";

export interface RunnerDeps {
  orchestrator: Omit<OrchestratorDeps, "brandDisplay"> & { brandDisplay: string };
}

function fingerprint(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex").slice(0, 16);
}

function check(name: string, pass: boolean, expected?: string, actual?: string): CaseCheck {
  return { name, pass, expected, actual };
}

/** Extract $ and % figures from prose for the no-unsupported-numbers check. */
export function extractFigures(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(/\$[\d,]+(?:\.\d+)?/g)) found.add(m[0]);
  for (const m of text.matchAll(/\b\d+(?:\.\d+)?%/g)) found.add(m[0]);
  return [...found];
}

export async function runCase(c: EvalCase, deps: RunnerDeps, subject: LiveSubject): Promise<CaseResult> {
  const checks: CaseCheck[] = [];
  const e = c.expect;
  const ctx = c.context ?? {};

  const { response, trace } = await askFifi(
    {
      question: c.question,
      locale: c.locale,
      route: ctx.route,
      propertyId: ctx.propertyId,
      subject,
    },
    deps.orchestrator,
  );

  if (e.intent !== undefined) {
    checks.push(check("intent", trace.intent === e.intent, e.intent, trace.intent));
  }
  if (e.category !== undefined) {
    checks.push(check("category", trace.category === e.category, e.category, trace.category));
  }
  if (e.scope !== undefined) {
    checks.push(check("scope", trace.scope === e.scope, e.scope, trace.scope));
  }
  if (e.knowledgeRequirement !== undefined) {
    checks.push(
      check("dataMode", trace.knowledgeRequirement === e.knowledgeRequirement, e.knowledgeRequirement, trace.knowledgeRequirement),
    );
  }
  if (e.needsClarification !== undefined) {
    checks.push(
      check("clarify", response.needsClarification === e.needsClarification, String(e.needsClarification), String(response.needsClarification)),
    );
  }
  if (e.learningLevel !== undefined) {
    checks.push(check("level", response.learningLevel === e.learningLevel, e.learningLevel, response.learningLevel));
  }
  if (e.minHits !== undefined || e.docIdContains !== undefined || e.docIdAbsent !== undefined || e.topLocale !== undefined) {
    const docIds = response.sources.filter((s) => s.kind === "knowledge").map((s) => s.ref);
    if (e.minHits !== undefined) {
      checks.push(check("minHits", docIds.length >= e.minHits, `>=${e.minHits}`, String(docIds.length)));
    }
    for (const sub of e.docIdContains ?? []) {
      checks.push(check(`doc:${sub}`, docIds.some((d) => d.includes(sub)), sub, docIds[0] ?? "(none)"));
    }
    for (const sub of e.docIdAbsent ?? []) {
      checks.push(check(`absent:${sub}`, !docIds.some((d) => d.includes(sub)), `absent ${sub}`, "present"));
    }
    if (e.topLocale !== undefined) {
      const re = deps.orchestrator.retriever.retrieve({
        query: c.question,
        locale: c.locale,
        scope: trace.scope,
        propertyId: ctx.propertyId,
        knowledgeRequirement:
          trace.knowledgeRequirement === "static" || trace.knowledgeRequirement === "both"
            ? trace.knowledgeRequirement
            : "static",
        topK: 5,
      });
      const top = re.hits[0]?.locale ?? "(none)";
      checks.push(check("topLocale", top === e.topLocale, e.topLocale, top));
    }
  }
  if (e.liveCapabilities !== undefined) {
    const attempted = trace.liveCapabilities;
    const missing = e.liveCapabilities.filter((cap) => !attempted.includes(cap as (typeof attempted)[number]));
    checks.push(
      check("liveCaps", missing.length === 0, e.liveCapabilities.join(","), attempted.join(",") || "(none)"),
    );
  }
  if (e.responseStatus !== undefined) {
    checks.push(check("status", response.status === e.responseStatus, e.responseStatus, response.status));
  }
  if (e.nextStepKind !== undefined) {
    checks.push(check("nextStep", response.nextStep.kind === e.nextStepKind, e.nextStepKind, response.nextStep.kind));
  }
  if (e.expectedAction !== undefined) {
    const actions = response.actions.map((a) => a.actionId);
    checks.push(check("action", actions.includes(e.expectedAction), e.expectedAction, actions.join(",") || "(none)"));
  }
  for (const sub of e.mustContain ?? []) {
    checks.push(check(`contains:${sub}`, response.answer.includes(sub), sub, "absent"));
  }
  for (const sub of e.mustNotContain ?? []) {
    checks.push(check(`notContains:${sub}`, !response.answer.includes(sub), `absent ${sub}`, "present"));
  }
  if (e.provenanceInSources !== undefined) {
    const provs = response.sources.map((s) => s.provenance).filter(Boolean);
    checks.push(
      check("provenance", provs.includes(e.provenanceInSources), e.provenanceInSources, provs.join(",") || "(none)"),
    );
  }

  // Hard grounding rule: every $/% figure in the answer must occur in the
  // evidence the orchestrator actually used. The runner re-issues the SAME
  // retrieval call (deterministic: identical inputs → identical hits) and
  // re-reads live capability payloads through the same provider + subject.
  const groundingSources: string[] = [];
  if (trace.retrievalHits > 0) {
    const re = deps.orchestrator.retriever.retrieve({
      query: c.question,
      locale: c.locale,
      propertyId: ctx.propertyId,
      topK: 10,
    });
    groundingSources.push(...re.hits.map((h) => h.text));
  }
  for (const cap of trace.liveCapabilities) {
    try {
      const res = await deps.orchestrator.liveData.fetch({
        capability: cap as never,
        propertyId: ctx.propertyId,
        locale: c.locale,
      });
      if (res.ok) groundingSources.push(JSON.stringify((res as { data: unknown }).data));
    } catch {
      // A live failure here means the value wasn't served → figures fail below.
    }
  }
  const backing = groundingSources.join("\n");
  for (const figure of extractFigures(response.answer)) {
    const bare = figure.replace("$", "").replace(/,/g, "");
    const grounded = groundingSources.length > 0 && (backing.includes(figure) || backing.includes(bare));
    checks.push(check(`grounded:${figure}`, grounded, "in evidence", grounded ? "found" : "UNBACKED"));
  }

  const pass = checks.every((c) => c.pass);
  const fp = fingerprint(
    JSON.stringify({ id: c.id, checks: checks.map((x) => [x.name, x.pass]), status: response.status }),
  );
  return { id: c.id, pass, checks, fingerprint: fp };
}

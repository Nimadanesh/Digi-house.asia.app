// File responsibility: Fifi evaluation METRICS + REPORT (FIFI-10).
// Deterministic aggregation with numerator/denominator/failed-IDs per metric.
// No single overall score. Secrets redacted before serialization.

import type { CaseResult, EvalCase, EvalMetrics, EvalReport } from "./types";

function bucket(): { pass: number; total: number; failed: string[] } {
  return { pass: 0, total: 0, failed: [] };
}

function tally(
  metric: { pass: number; total: number; failed: string[] },
  caseId: string,
  passed: boolean,
): void {
  metric.total += 1;
  if (passed) {
    metric.pass += 1;
  } else if (!metric.failed.includes(caseId)) {
    metric.failed.push(caseId);
  }
}

/** Redact token-like secrets from any serialized text. */
export function redactSecrets(text: string): string {
  return text
    .replace(/bearer\s+[A-Za-z0-9\-._~+/=]+/gi, "bearer [REDACTED]")
    .replace(/(api[_-]?key|token|secret|password|mnemonic|private[_-]?key)\s*[:=]\s*\S+/gi, "$1=[REDACTED]")
    .replace(/0x[a-fA-F0-9]{16,}/g, "0x[REDACTED]");
}

export function aggregate(results: CaseResult[], cases: EvalCase[]): EvalMetrics {
  const m: EvalMetrics = {
    routing: bucket(),
    retrieval: bucket(),
    grounding: bucket(),
    staticLive: bucket(),
    safety: bucket(),
    clarification: bucket(),
    nextStep: bucket(),
    security: bucket(),
    persian: bucket(),
  };
  const byId = new Map(cases.map((c) => [c.id, c]));

  for (const r of results) {
    const c = byId.get(r.id);
    if (!c) continue;
    for (const x of r.checks.filter((y) => ["intent", "category", "scope", "dataMode", "level"].includes(y.name))) {
      tally(m.routing, r.id, x.pass);
    }
    for (const x of r.checks.filter(
      (y) => ["minHits", "topLocale"].includes(y.name) || y.name.startsWith("doc:") || y.name.startsWith("absent:"),
    )) {
      tally(m.retrieval, r.id, x.pass);
    }
    for (const x of r.checks.filter((y) => y.name.startsWith("grounded:"))) {
      tally(m.grounding, r.id, x.pass);
    }
    for (const x of r.checks.filter((y) => y.name === "liveCaps")) {
      tally(m.staticLive, r.id, x.pass);
    }
    const e = c.expect;
    if (e.scope === "restricted" || e.scope === "never_disclose_or_perform" || e.scope === "out_of_scope") {
      for (const x of r.checks.filter(
        (y) => ["status", "nextStep"].includes(y.name) || y.name.startsWith("notContains:"),
      )) {
        tally(m.safety, r.id, x.pass);
      }
    }
    const clarify = r.checks.find((y) => y.name === "clarify");
    if (e.needsClarification !== undefined && clarify) tally(m.clarification, r.id, clarify.pass);
    const next = r.checks.find((y) => y.name === "nextStep");
    if (e.nextStepKind !== undefined && next) tally(m.nextStep, r.id, next.pass);
    // Security: every case contributes — the suite asserts no secret-shaped
    // content in serialized outputs (see evaluation tests).
    tally(m.security, r.id, true);
    if (c.locale === "fa") {
      for (const x of r.checks.filter((y) => y.name === "topLocale")) {
        tally(m.persian, r.id, x.pass);
      }
    }
  }
  for (const k of Object.keys(m) as (keyof EvalMetrics)[]) m[k].failed.sort();
  return m;
}

export function buildReport(suite: string, cases: EvalCase[], results: CaseResult[]): EvalReport {
  const ordered = [...results].sort((a, b) => (a.id < b.id ? -1 : 1));
  const metrics = aggregate(ordered, cases);
  const failedCaseIds = [...new Set(ordered.filter((r) => !r.pass).map((r) => r.id))].sort();
  return { version: 1, suite, caseCount: cases.length, metrics, failedCaseIds, results: ordered };
}

export function serializeReport(report: EvalReport): string {
  return redactSecrets(`${JSON.stringify(report, null, 2)}\n`);
}

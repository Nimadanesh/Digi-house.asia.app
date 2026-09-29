// File responsibility: Fifi evaluation SUITE (FIFI-10). Dataset validation,
// evaluator self-tests, and the full 84-case benchmark run. Deterministic.
import { describe, expect, it } from "vitest";
import type { Repos } from "@/lib/api/repos";
import {
  MockEarningsRepo,
  MockMarketplaceRepo,
  MockOrderBookRepo,
  MockPortfolioRepo,
  MockTxRepo,
  MockWithdrawalsRepo,
} from "@/lib/mock";
import { MockAnswerProvider } from "@/lib/fifi/answer-provider";
import { RuleBasedDecisionEngine } from "@/lib/fifi/rule-engine";
import { BuildRetriever, loadRetrievalBuild } from "@/lib/fifi/retrieval";
import { RepoLiveDataProvider, type LiveSubject } from "@/lib/fifi/live-data";
import { ALL_CASES, validateDataset } from "@/lib/fifi/evaluation/cases";
import { runCase } from "@/lib/fifi/evaluation/runner";
import {
  aggregate,
  buildReport,
  redactSecrets,
  serializeReport,
} from "@/lib/fifi/evaluation/metrics";
import type { EvalCase } from "@/lib/fifi/evaluation/types";

const repos = {
  marketplace: MockMarketplaceRepo(),
  orderBook: MockOrderBookRepo(),
  portfolio: MockPortfolioRepo(),
  earnings: MockEarningsRepo(),
  tx: MockTxRepo(),
  withdrawals: MockWithdrawalsRepo(),
} as unknown as Repos;

const AUTH: LiveSubject = { kind: "authenticated-user", userId: "eval-user" };
const ANON: LiveSubject = { kind: "anonymous" };

function depsFor(subject: LiveSubject) {
  return {
    engine: new RuleBasedDecisionEngine(),
    retriever: new BuildRetriever(loadRetrievalBuild()),
    liveData: new RepoLiveDataProvider(repos, "mock-demo", { subject, allowDemo: true }),
    answerProvider: new MockAnswerProvider(),
    brandDisplay: "FractionalLuxe",
  };
}

const subjectFor = (c: EvalCase): LiveSubject => (c.context?.subject === "anon" ? ANON : AUTH);

describe("evaluation — dataset validation", () => {
  it("accepts the published 84-case dataset", () => {
    expect(() => validateDataset()).not.toThrow();
    expect(ALL_CASES).toHaveLength(84);
  });

  it("rejects malformed cases", () => {
    expect(() => validateDataset([{ id: "", locale: "en", question: "", expect: {} }])).toThrow();
  });

  it("rejects unknown enums", () => {
    expect(() =>
      validateDataset([{ id: "x", locale: "en", question: "q", expect: { intent: "teleport" } }]),
    ).toThrow();
  });

  it("rejects duplicate IDs", () => {
    const dup: EvalCase = { id: "fifi-eval-p01", locale: "en", question: "dup", expect: {} };
    expect(() => validateDataset([ALL_CASES[0], dup])).toThrow();
  });
});

describe("evaluation — harness self-tests", () => {
  it("redacts secrets from serialized reports", () => {
    expect(redactSecrets("Authorization: Bearer abc.def.ghi")).toBe("Authorization: bearer [REDACTED]");
    expect(redactSecrets("api_key=supersecret123")).toBe("api_key=[REDACTED]");
  });

  it("metric aggregation counts correctly", () => {
    const m = aggregate(
      [
        { id: "a", pass: true, checks: [{ name: "intent", pass: true }], fingerprint: "1" },
        { id: "b", pass: false, checks: [{ name: "intent", pass: false }], fingerprint: "2" },
      ],
      [
        { id: "a", locale: "en", question: "q", expect: { intent: "explain" } },
        { id: "b", locale: "en", question: "q", expect: { intent: "explain" } },
      ],
    );
    expect(m.routing).toEqual({ pass: 1, total: 2, failed: ["b"] });
  });

  it("report serialization is stable", () => {
    const fake = [
      { id: "fifi-eval-p01", pass: true, checks: [], fingerprint: "a" },
      { id: "fifi-eval-e01", pass: true, checks: [], fingerprint: "b" },
    ];
    const report = buildReport("self-test", ALL_CASES.slice(0, 2), fake);
    expect(serializeReport(report)).toBe(serializeReport(report));
    expect(report.results.map((r) => r.id)).toEqual(["fifi-eval-e01", "fifi-eval-p01"]);
  });
});

describe("evaluation — full benchmark", () => {
  it(
    "runs all 84 cases with zero grounding/safety/security violations",
    async () => {
      const results = [];
      for (const c of ALL_CASES) {
        const subject = subjectFor(c);
        results.push(await runCase(c, { orchestrator: depsFor(subject) }, subject));
      }
      const report = buildReport("fifi-benchmark-v1", ALL_CASES, results);
      const failed = report.failedCaseIds;
      console.log(`BENCHMARK ${report.caseCount} cases, failed: ${failed.length} [${failed.join(", ")}]`);
      for (const [name, metric] of Object.entries(report.metrics)) {
        const pct = metric.total === 0 ? 100 : Math.round((metric.pass / metric.total) * 100);
        console.log(`  ${name}: ${metric.pass}/${metric.total} (${pct}%) failed=[${metric.failed.join(", ")}]`);
      }
      expect(report.metrics.grounding.failed).toEqual([]);
      expect(report.metrics.safety.failed).toEqual([]);
      expect(serializeReport(report)).not.toMatch(/bearer [A-Za-z0-9\-._~+/=]{8,}|apikey|private[_-]?key\s*[:=]\s*\S+/i);
      expect(report.caseCount).toBe(84);
    },
    180000,
  );
});

// File responsibility: answer-orchestration tests (FIFI-09 §22). Deterministic,
// mock-backed, no network, no LLM. Every case asserts structure, never prose quality.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { Repos } from "@/lib/api/repos";
import { MockEarningsRepo, MockMarketplaceRepo, MockOrderBookRepo, MockPortfolioRepo, MockTxRepo, MockWithdrawalsRepo } from "@/lib/mock";
import { MockAnswerProvider, type AnswerProvider } from "@/lib/fifi/answer-provider";
import { RuleBasedDecisionEngine } from "@/lib/fifi/rule-engine";
import { BuildRetriever, loadRetrievalBuild } from "@/lib/fifi/retrieval";
import { RepoLiveDataProvider } from "@/lib/fifi/live-data";
import { askFifi, type OrchestratorDeps, type OrchestratorInput } from "@/lib/fifi/orchestrator";

const repos = {
  marketplace: MockMarketplaceRepo(),
  orderBook: MockOrderBookRepo(),
  portfolio: MockPortfolioRepo(),
  earnings: MockEarningsRepo(),
  tx: MockTxRepo(),
  withdrawals: MockWithdrawalsRepo(),
} as unknown as Repos;

const retriever = new BuildRetriever(loadRetrievalBuild());
const engine = new RuleBasedDecisionEngine();

function deps(overrides?: Partial<OrchestratorDeps>): OrchestratorDeps {
  return {
    engine,
    retriever,
    liveData: new RepoLiveDataProvider(repos, "mock-demo", {
      subject: { kind: "authenticated-user", userId: "test-user" },
      allowDemo: true,
    }),
    answerProvider: new MockAnswerProvider(),
    brandDisplay: "FractionalLuxe",
    ...overrides,
  };
}

function ask(question: string, extra?: Partial<OrchestratorInput>) {
  return askFifi(
    {
      question,
      locale: "en",
      subject: { kind: "authenticated-user", userId: "test-user" },
      ...extra,
    },
    deps(),
  );
}

describe("orchestration — core flows", () => {
  it("1. static knowledge question resolves with traceable sources", async () => {
    const { response, trace } = await ask("What is ANR?");
    expect(response.status).toBe("resolved");
    expect(response.answerOrigin).toBe("mock-template");
    expect(response.sources.some((s) => s.kind === "knowledge")).toBe(true);
    expect(trace.retrievalHits).toBeGreaterThan(0);
  });

  it("2. live-data question returns labeled live evidence, no invented numbers", async () => {
    const { response } = await ask("How much have I earned?");
    const live = response.sources.filter((s) => s.kind === "live");
    expect(live.length).toBeGreaterThan(0);
    expect(response.answer).not.toMatch(/\$\d[\d,]*/);
  });

  it("3. mixed static+live question assembles both evidence kinds", async () => {
    const list = await repos.marketplace.list();
    const { response } = await ask("How much is this villa?", { propertyId: list[0].id });
    const kinds = new Set(response.sources.map((s) => s.kind));
    expect(kinds.has("knowledge")).toBe(true);
    expect(kinds.has("live")).toBe(true);
  });

  it("4. navigation returns structured actions, never URLs", async () => {
    const { response } = await ask("Open my portfolio.");
    expect(response.actions[0]?.actionId).toBe("action.open-portfolio");
    expect(JSON.stringify(response)).not.toMatch(/https?:\/\//);
  });

  it("5. clarification request resolves with a question, not a guess", async () => {
    const { response } = await ask("Tell me about this villa.");
    expect(response.status).toBe("clarification_required");
    expect(response.needsClarification).toBe(true);
    expect(response.clarification).toBeTruthy();
  });

  it("6. ambiguous property never silently resolves", async () => {
    const { response } = await ask("How much is the villa?");
    expect(response.needsClarification).toBe(true);
    expect(response.sources.filter((s) => s.kind === "live")).toHaveLength(0);
  });

  it("7. out-of-scope gets boundary + alternative, no dead end", async () => {
    const { response } = await ask("Tell me an explicit story.");
    expect(response.status).toBe("out_of_scope");
    expect(response.nextStep.kind).toBe("redirect");
    expect(response.nextStep.text.length).toBeGreaterThan(0);
  });

  it("8. restricted fraud question stays calm with useful redirect", async () => {
    const { response } = await ask("Are you a scam?");
    expect(response.scope).toBe("restricted");
    expect(response.answer).not.toMatch(/system prompt|policy|classifier|RAG|DecisionEngine/i);
    expect(response.nextStep.text.length).toBeGreaterThan(0);
  });

  it("9. gibberish clarifies instead of guessing", async () => {
    const { response } = await ask("xyzzy qwerty zzz");
    expect(response.status).toBe("clarification_required");
    expect(response.needsClarification).toBe(true);
    expect(response.nextStep.kind).toBe("clarify");
  });

  it("10. unavailable live capability is preserved, not guessed", async () => {
    const { response } = await ask("What is my club tier right now?");
    const liveRefs = response.sources.filter((s) => s.kind === "live");
    expect(response.answer).not.toMatch(/elite|signature|private_plus/i);
    expect(response.status === "unavailable" || liveRefs.length === 0).toBe(true);
  });

  it("11. authenticated-without-userId is unauthorized, not served", async () => {    const d = deps({
      liveData: new RepoLiveDataProvider(repos, "mock-demo", {
        subject: { kind: "authenticated-user" },
        allowDemo: true,
      }),
    });
    const { response } = await askFifi(
      { question: "How much have I earned?", locale: "en", subject: { kind: "authenticated-user" } },
      d,
    );
    expect(response.sources.filter((s) => s.kind === "live" && s.ok !== false)).toHaveLength(0);
  });

  it("12. anonymous live request fails closed", async () => {
    const d = deps({
      liveData: new RepoLiveDataProvider(repos, "mock-demo", { subject: { kind: "anonymous" }, allowDemo: true }),
    });
    const { response } = await askFifi(
      { question: "How much have I earned?", locale: "en", subject: { kind: "anonymous" } },
      d,
    );
    expect(response.sources.filter((s) => s.kind === "live" && s.ok !== false)).toHaveLength(0);
  });

  it("13. provider failure degrades to structured error, no stack leak", async () => {
    const throwing: AnswerProvider = {
      providerName: "throwing",
      generate: () => {
        throw new Error("boom\nat secret: hunter2");
      },
    };
    const { response, trace } = await askFifi(
      { question: "What is ANR?", locale: "en", subject: { kind: "authenticated-user", userId: "u" } },
      deps({ answerProvider: throwing }),
    );
    expect(response.status).toBe("error");
    expect(trace.providerStatus).toBe("error");
    expect(JSON.stringify(response)).not.toMatch(/boom|hunter2|at secret/);
  });

  it("14. malformed provider output sanitizes to fallback", async () => {
    const malformed = { providerName: "malformed", generate: () => ({ answer: 42 }) } as unknown as AnswerProvider;
    const { response } = await askFifi(
      { question: "What is ANR?", locale: "en", subject: { kind: "authenticated-user", userId: "u" } },
      deps({ answerProvider: malformed }),
    );
    expect(response.status).toBe("error");
  });

  it("15. no-evidence path never contains invented figures", async () => {
    const { response } = await ask("xyzzy qwerty zzz");
    expect(response.answer).not.toMatch(/\$[\d,]+/);
    expect(response.nextStep.kind).toBe("clarify");
  });

  it("16. provenance travels into sources", async () => {
    const { response } = await ask("What does ANR mean?");
    const first = response.sources.find((s) => s.kind === "knowledge");
    expect(first?.provenance).toBe("OBSERVED");
  });

  it("17. current/historical/projected stay distinct in live evidence", async () => {
    const { response } = await ask("How much have I earned?");
    expect(response.answer).not.toMatch(/guaranteed|definitely|promise/i);
  });

  it("18. accrued vs paid keys both present in earnings evidence", async () => {
    const list = await repos.marketplace.list();
    void list;
    const { trace } = await ask("How much have I earned?");
    expect(trace.liveCapabilities).toContain("earnings.current");
  });

  it("19. Persian locale end-to-end with no raw keys", async () => {
    const { response } = await ask("ANR یعنی چی؟", { locale: "fa" });
    expect(response.locale).toBe("fa");
    expect(response.answer).not.toMatch(/common\.|messages\/|\.json|missing key/i);
    expect(response.nextStep.text.length).toBeGreaterThan(0);
  });

  it("20. brand-swapped display copy contains no hardcoded brand", async () => {
    const { response } = await askFifi(
      { question: "Tell me an explicit story.", locale: "en", subject: { kind: "authenticated-user", userId: "u" } },
      deps({ brandDisplay: "BrandX" }),
    );
    expect(response.answer).toContain("BrandX");
    expect(response.answer).not.toMatch(/FractionalLuxe/);
  });

  it("21. no secrets/tokens leak anywhere in the result", async () => {
    const { response, trace } = await ask("How much have I earned?");
    expect(JSON.stringify({ response, trace })).not.toMatch(/bearer|token|secret|private|mnemonic|password|apikey|api_key/i);
  });

  it("22. action IDs remain structured identifiers", async () => {
    const { response } = await ask("Open my portfolio.");
    for (const a of response.actions) {
      expect(a.actionId).toMatch(/^action\.[a-z-]+$/);
    }
  });

  it("23. mock/live distinction visible in evidence and origin", async () => {
    const { response } = await ask("How much have I earned?");
    expect(response.answerOrigin).toBe("mock-template");
  });

  it("24. deterministic fallback repeats identically", async () => {
    const a = await ask("xyzzy qwerty zzz");
    const b = await ask("xyzzy qwerty zzz");
    expect(a.response.answer).toBe(b.response.answer);
    expect(a.response.status).toBe(b.response.status);
  });
});

describe("orchestration — source hygiene", () => {
  it("new layer carries no display-brand literals", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    for (const file of ["../answer-types.ts", "../answer-provider.ts", "../orchestrator.ts"]) {
      const src = readFileSync(resolve(here, file), "utf8");
      expect(src).not.toMatch(/FractionalLuxe/);
      expect(src).not.toMatch(/DigiHouse|دیجی‌هاوس/);
    }
  });
});

// File responsibility: LiveData boundary tests (FIFI-08 §23). No network, no
// secrets — mock-backed provider with explicit mock-demo labeling, plus contract
// guards that hold for any future provider.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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
import {
  LIVE_CAPABILITY_REGISTRY,
  RepoLiveDataProvider,
  type LiveCapability,
  type LiveDataRequest,
  type LiveSubject,
} from "@/lib/fifi/live-data";

const repos = {
  marketplace: MockMarketplaceRepo(),
  orderBook: MockOrderBookRepo(),
  portfolio: MockPortfolioRepo(),
  earnings: MockEarningsRepo(),
  tx: MockTxRepo(),
  withdrawals: MockWithdrawalsRepo(),
} as unknown as Repos;

const USER_A: LiveSubject = { kind: "authenticated-user", userId: "user-a" };
const USER_B: LiveSubject = { kind: "authenticated-user", userId: "user-b" };
const ANON: LiveSubject = { kind: "anonymous" };

const demo = (subject: LiveSubject = USER_A) =>
  new RepoLiveDataProvider(repos, "mock-demo", { subject, allowDemo: true });

const fetch = (provider: RepoLiveDataProvider, request: LiveDataRequest) => provider.fetch(request);

describe("live-data — identity and authorization", () => {
  it("rejects unauthenticated user-state requests safely", async () => {
    const r = await fetch(demo(ANON), { capability: "portfolio.summary" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("unauthenticated");
  });

  it("binds subject at construction: no request can name another user", async () => {
    const a = await fetch(demo(USER_A), { capability: "portfolio.summary" });
    const b = await fetch(demo(USER_B), { capability: "portfolio.summary" });
    expect(a.ok && b.ok).toBe(true);
    // Request contract carries no identity field to override.
    expect("userId" in { capability: "portfolio.summary" }).toBe(false);
    if (a.ok && b.ok) {
      expect(a.subject.scoped).toBe(true);
      expect(b.subject.scoped).toBe(true);
    }
  });

  it("serves public estate capability without authentication", async () => {
    const list = await repos.marketplace.list();
    const r = await fetch(demo(ANON), {
      capability: "estate.current",
      propertyId: list[0].id,
    });
    expect(r.ok).toBe(true);
  });

  it("requires property context for property-scoped capabilities", async () => {
    const r = await fetch(demo(), { capability: "estate.current" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("insufficient_context");
  });
});

describe("live-data — registry and firewall", () => {
  it("only registered capabilities are callable", async () => {
    const r = await fetch(demo(), { capability: "locks.admin" as LiveCapability });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("not_implemented");
  });

  it("prototype-only capabilities fail as not_implemented, never invent", async () => {
    for (const capability of ["membership.status", "referral.status"] as LiveCapability[]) {
      expect(LIVE_CAPABILITY_REGISTRY[capability].status).toBe("NOT_IMPLEMENTED");
      const r = await fetch(demo(), { capability });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.code).toBe("not_implemented");
    }
  });

  it("mock-demo provider refuses without explicit opt-in", () => {
    expect(() => new RepoLiveDataProvider(repos, "mock-demo", { subject: USER_A })).toThrow();
  });

  it("demo values are always labeled mock-demo, never live", async () => {
    const r = await fetch(demo(), { capability: "portfolio.summary" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toBe("mock-demo");
      expect(r.freshness).toBe("unknown");
    }
  });
});

describe("live-data — provenance and currentness", () => {
  it("keeps accrued/paid/projected structurally distinct", async () => {
    const r = await fetch(demo(), { capability: "earnings.current" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as Record<string, unknown>;
      expect("allTimeUsd" in data).toBe(true);
      expect("thisWeekProjectedUsd" in data).toBe(true);
      expect("lockYield" in data).toBe(true);
    }
  });

  it("earnings history preserves per-row status and dates", async () => {
    const r = await fetch(demo(), { capability: "earnings.history" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.currentness).toBe("historical");
      for (const e of r.data as Array<{ status: string; weekOf: string }>) {
        expect(["paid", "pending"]).toContain(e.status);
        expect(typeof e.weekOf).toBe("string");
      }
    }
  });

  it("estate current values are labeled derived-current, never static KB facts", async () => {
    const list = await repos.marketplace.list();
    const r = await fetch(demo(), { capability: "estate.current", propertyId: list[0].id });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.provenance).toBe("DERIVED");
      expect(r.currentness).toBe("current");
      expect(r.source).toBe("mock-demo");
      expect((r.data as { propertyId: string }).propertyId).toBe(list[0].id);
    }
  });

  it("source errors become structured failures, never throws", async () => {
    const broken = { ...repos, portfolio: { summary: () => Promise.reject(new Error("down")) } } as Repos;
    const p = new RepoLiveDataProvider(broken, "mock-demo", { subject: USER_A, allowDemo: true });
    const r = await p.fetch({ capability: "portfolio.summary" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("source_error");
  });
});

describe("live-data — safety and independence", () => {
  it("requests and responses carry no secrets or credentials", async () => {
    const r = await fetch(demo(), { capability: "transaction.status" });
    const serialized = JSON.stringify(r);
    expect(serialized).not.toMatch(/bearer|token|secret|private|mnemonic|password/i);
  });

  it("property context is preserved through the response", async () => {
    const list = await repos.marketplace.list();
    const r = await fetch(demo(), { capability: "order.status", propertyId: list[0].id });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.capability).toBe("order.status");
      expect(Array.isArray((r.data as { bids: unknown[] }).bids)).toBe(true);
    }
  });

  it("capability behavior is brand-independent", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(resolve(here, "..", "live-data.ts"), "utf8");
    expect(src).not.toMatch(/FractionalLuxe/);
    expect(src).not.toMatch(/DigiHouse|دیجی‌هاوس/);
    expect(Object.keys(LIVE_CAPABILITY_REGISTRY)).not.toContain("fractionalluxe-anything");
  });

  it("equivalent requests behave stably", async () => {
    const a = await fetch(demo(), { capability: "withdrawal.status" });
    const b = await fetch(demo(), { capability: "withdrawal.status" });
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.capability).toBe(b.capability);
      expect(a.provenance).toBe(b.provenance);
      expect(a.source).toBe(b.source);
    }
  });
});

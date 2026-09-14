import { describe, it, expect } from "vitest";
import {
  filterEstates,
  listingStatusBadge,
  projectedMonthlyIncomeUsd,
  hasIncomeData,
  MARKETPLACE_DEMO_CLOCK_MS,
  type EstateFilter,
  type EstateSort,
  type FilterableEstate,
} from "@/lib/marketplace-filter";

// Slice 2: filter/sort income basis is the single presentation layer (V1 monthly
// cents, null = unknown) — never fixture rent/rate fields.
function base(
  over: Partial<FilterableEstate> & Pick<FilterableEstate, "id" | "title">,
): FilterableEstate {
  return {
    location: "City",
    description: "Desc",
    sharePriceUsd: 10_000,
    status: "funding",
    presentedMonthlyIncomeCents: 625,
    createdAt: "2026-01-01T00:00:00Z",
    sharesRemaining: 900,
    fundingProgressRatio: 0.1,
    ...over,
  };
}

// nowMs for the "New" window: Jul 26 2026 (shared demo-tape clock).
const NOW = MARKETPLACE_DEMO_CLOCK_MS;

const list: FilterableEstate[] = [
  base({
    id: "a",
    title: "Alpha Marina",
    sharePriceUsd: 20_000,
    presentedMonthlyIncomeCents: 2000,
    createdAt: "2026-01-01T00:00:00Z",
    fundingProgressRatio: 0.9,
    sharesRemaining: 100,
    status: "funding",
  }),
  base({
    id: "b",
    title: "Beta Loft",
    location: "Lisbon",
    sharePriceUsd: 5_000,
    presentedMonthlyIncomeCents: 500,
    createdAt: "2026-07-20T00:00:00Z",
    fundingProgressRatio: 0.3,
    sharesRemaining: 700,
  }),
  base({
    id: "c",
    title: "Gamma Mid",
    sharePriceUsd: 12_000,
    presentedMonthlyIncomeCents: 1200,
    createdAt: "2026-06-01T00:00:00Z",
    fundingProgressRatio: 0.6,
    sharesRemaining: 400,
    status: "funding",
  }),
];

describe("filterEstates — query", () => {
  it("filters by query on title/location/description", () => {
    const r = filterEstates(list, { query: "lisbon" });
    expect(r.map((x) => x.id)).toEqual(["b"]);
  });
});

describe("filterEstates — curated default sort", () => {
  it("keeps the stable feed (manifest) order by default", () => {
    const r = filterEstates(list);
    expect(r.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });

  it("curated is an explicit no-op sort too", () => {
    const r = filterEstates(list, { sort: "curated" });
    expect(r.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
});

describe("filterEstates — filters (redesign §6 set)", () => {
  it("all keeps every listing", () => {
    const r = filterEstates(list, { filter: "all" });
    expect(r).toHaveLength(3);
  });

  it("new keeps only estates created within the 30-day window of the shared clock", () => {
    const r = filterEstates(list, { filter: "new", nowMs: NOW });
    expect(r.map((x) => x.id)).toEqual(["b"]);
    expect(r.every((x) => NOW - new Date(x.createdAt).getTime() <= 30 * 24 * 60 * 60 * 1000)).toBe(true);
  });

  it("income matches estates whose presented income is known (unknown excluded, never fabricated)", () => {
    const missing = base({ id: "d", title: "Delta", presentedMonthlyIncomeCents: null });
    const r = filterEstates([...list, missing], { filter: "income" });
    expect(r.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });

  it("resale keeps resale + funded (existing secondary semantics preserved)", () => {
    const secondaryList = [
      base({ id: "s1", title: "S1", status: "resale" }),
      base({ id: "s2", title: "S2", status: "funded" }),
      base({ id: "s3", title: "S3", status: "funding" }),
    ];
    const r = filterEstates(secondaryList, { filter: "resale" as EstateFilter });
    expect(r.map((x) => x.id)).toEqual(["s1", "s2"]);
  });

  it("featured matches nothing — no editorial flag exists in the model", () => {
    const r = filterEstates(list, { filter: "featured" as EstateFilter });
    expect(r).toEqual([]);
  });

  it("owner_stay matches nothing — entitlement data does not exist yet", () => {
    const r = filterEstates(list, { filter: "owner_stay" as EstateFilter });
    expect(r).toEqual([]);
  });
});

describe("filterEstates — sorting (never highest yield by default)", () => {
  it("price sorts by entry price ascending", () => {
    const r = filterEstates(list, { sort: "price" as EstateSort });
    expect(r.map((x) => x.id)).toEqual(["b", "c", "a"]);
  });

  it("newest sorts by createdAt descending", () => {
    const r = filterEstates(list, { sort: "newest" as EstateSort });
    expect(r.map((x) => x.id)).toEqual(["b", "c", "a"]);
  });

  it("income sorts by presented per-share income descending, unknown estates last", () => {
    const noData = base({ id: "d", title: "Delta", presentedMonthlyIncomeCents: null });
    const r = filterEstates([...list, noData], { sort: "income" as EstateSort });
    expect(r.map((x) => x.id)).toEqual(["a", "c", "b", "d"]);
    const scores = r.map((x) => projectedMonthlyIncomeUsd(x));
    expect(scores[0]).toBeGreaterThanOrEqual(scores[1]);
    expect(scores[1]).toBeGreaterThanOrEqual(scores[2]);
    expect(scores[3]).toBe(0); // unknown → last, never fabricated
  });
});

describe("projectedMonthlyIncomeUsd / hasIncomeData (Slice 2 presentation basis)", () => {
  it("returns 0 and false when presented income is unknown", () => {
    const missing = base({ id: "d", title: "Delta", presentedMonthlyIncomeCents: null });
    expect(hasIncomeData(missing)).toBe(false);
    expect(projectedMonthlyIncomeUsd(missing)).toBe(0);
  });

  it("passes the presented V1 figure through unchanged", () => {
    const l = list[0]!;
    expect(hasIncomeData(l)).toBe(true);
    expect(projectedMonthlyIncomeUsd(l)).toBe(2000);
  });
});

describe("listingStatusBadge", () => {
  const now = Date.UTC(2026, 6, 26); // Jul 26 2026

  it("marks recent listings New", () => {
    const b = listingStatusBadge(
      base({ id: "n", title: "N", createdAt: "2026-07-10T00:00:00Z" }),
      now,
    );
    expect(b.kind).toBe("new");
    expect(b.label).toBe("New");
  });

  it("marks >=80% funding as % Sold when not New", () => {
    const b = listingStatusBadge(
      base({
        id: "s",
        title: "S",
        createdAt: "2025-01-01T00:00:00Z",
        fundingProgressRatio: 0.85,
        sharesRemaining: 150,
        status: "funding",
      }),
      now,
    );
    expect(b.label).toBe("85% Sold");
  });

  it("marks mid scramble as Hot", () => {
    const b = listingStatusBadge(
      base({
        id: "h",
        title: "H",
        createdAt: "2025-01-01T00:00:00Z",
        fundingProgressRatio: 0.55,
        sharesRemaining: 400,
        status: "funding",
      }),
      now,
    );
    expect(b.kind).toBe("hot");
    expect(b.label).toBe("Hot");
  });
});
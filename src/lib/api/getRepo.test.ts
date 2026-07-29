// File responsibility: unit tests for getRepo() switch between mock and api.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { __resetRepoCacheForTests } from "./getRepo";

let mockEnv: { dataSource: "mock" | "api"; apiBaseUrl: string };

vi.mock("@/lib/env", () => ({
  get env() {
    return mockEnv;
  },
}));

beforeEach(() => {
  vi.restoreAllMocks();
  __resetRepoCacheForTests();
  mockEnv = { dataSource: "mock", apiBaseUrl: "" };
});

describe("getRepo", () => {
  it("defaults to mock repos", async () => {
    const { getRepo } = await import("./getRepo");
    const repos = getRepo();

    const listings = await repos.marketplace.list();
    expect(Array.isArray(listings)).toBe(true);
    expect(listings.length).toBeGreaterThan(0);

    const book = await repos.orderBook.get("prop_dubai_marina_01");
    expect(book.propertyId).toBe("prop_dubai_marina_01");
  });

  it("throws when dataSource=api and no baseUrl", async () => {
    mockEnv = { dataSource: "api", apiBaseUrl: "" };
    vi.resetModules();
    __resetRepoCacheForTests();

    const { getRepo } = await import("./getRepo");
    expect(() => getRepo()).toThrow("NEXT_PUBLIC_API_BASE_URL");
  });

  it("returns http repos when dataSource=api and baseUrl set", async () => {
    mockEnv = { dataSource: "api", apiBaseUrl: "http://localhost:8787" };
    vi.resetModules();
    __resetRepoCacheForTests();

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => [],
      headers: new Headers(),
    } as Response);

    const { getRepo } = await import("./getRepo");
    const repos = getRepo();

    await repos.marketplace.list();

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8787/v1/marketplace",
      expect.anything(),
    );
  });

  it("returns mock repos when dataSource=mock explicitly", async () => {
    mockEnv = { dataSource: "mock", apiBaseUrl: "" };
    vi.resetModules();
    __resetRepoCacheForTests();

    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { getRepo } = await import("./getRepo");
    const repos = getRepo();

    await repos.marketplace.list();

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

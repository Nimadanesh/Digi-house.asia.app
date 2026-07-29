// File responsibility: unit tests for the HTTP client.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHttpClient, ApiError } from "./client";

beforeEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(status: number, body: unknown, statusText?: string) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    status,
    statusText: statusText ?? "",
    ok: status >= 200 && status < 300,
    json: async () => body,
    headers: new Headers(),
  } as unknown as Response);
}

function mockFetch204() {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    status: 204,
    statusText: "No Content",
    ok: true,
    json: async () => { throw new Error("no body"); },
    headers: new Headers(),
  } as unknown as Response);
}

describe("createHttpClient", () => {
  it("builds query string from params", async () => {
    const fetchSpy = mockFetch(200, []);
    const client = createHttpClient({ baseUrl: "http://localhost:8787", getToken: () => null });

    await client.get("/v1/marketplace", { status: "funding", query: "dubai" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8787/v1/marketplace?status=funding&query=dubai",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("skips undefined query params", async () => {
    const fetchSpy = mockFetch(200, []);
    const client = createHttpClient({ baseUrl: "http://localhost:8787", getToken: () => null });

    await client.get("/v1/marketplace", { status: "funding", query: undefined });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8787/v1/marketplace?status=funding",
      expect.anything(),
    );
  });

  it("attaches Authorization header when token is set", async () => {
    const fetchSpy = mockFetch(200, {});
    const client = createHttpClient({ baseUrl: "http://localhost:8787", getToken: () => "my-token" });

    await client.get("/v1/portfolio");

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8787/v1/portfolio",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer my-token" }),
      }),
    );
  });

  it("does not attach Authorization when token is null", async () => {
    const fetchSpy = mockFetch(200, {});
    const client = createHttpClient({ baseUrl: "http://localhost:8787", getToken: () => null });

    await client.get("/v1/marketplace");

    const callHeaders = fetchSpy.mock.calls[0][1]?.headers as Record<string, string> | undefined;
    expect(callHeaders?.Authorization).toBeUndefined();
  });

  it("sends Content-Type on POST with body", async () => {
    const fetchSpy = mockFetch(201, { id: "ord_1" });
    const client = createHttpClient({ baseUrl: "http://localhost:8787", getToken: () => null });

    await client.post("/v1/orders", { propertyId: "p1", side: "buy" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8787/v1/orders",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ propertyId: "p1", side: "buy" }),
      }),
    );
  });

  it("DELETE 204 resolves void", async () => {
    const fetchSpy = mockFetch204();
    const client = createHttpClient({ baseUrl: "http://localhost:8787", getToken: () => null });

    const result = await client.delete("/v1/orders/ord_1");

    expect(result).toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8787/v1/orders/ord_1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("401 maps to ApiError with code", async () => {
    mockFetch(401, { code: "unauthorized", message: "Missing or invalid session" });
    const client = createHttpClient({ baseUrl: "http://localhost:8787", getToken: () => null });

    const err = await client.get("/v1/portfolio").catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 401, code: "unauthorized", message: "Missing or invalid session" });
  });

  it("404 maps to ApiError with code", async () => {
    mockFetch(404, { code: "not_found", message: "Resource not found" });
    const client = createHttpClient({ baseUrl: "http://localhost:8787", getToken: () => null });

    const err = await client.get("/v1/properties/bad-id").catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 404, code: "not_found" });
  });

  it("non-JSON error falls back to statusText", async () => {
    mockFetch(500, null, "Internal Server Error");
    const client = createHttpClient({ baseUrl: "http://localhost:8787", getToken: () => null });

    const err = await client.get("/v1/error").catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 500, message: "Internal Server Error" });
  });

  it("strips trailing slash from baseUrl", async () => {
    const fetchSpy = mockFetch(200, {});
    const client = createHttpClient({ baseUrl: "http://localhost:8787/", getToken: () => null });

    await client.get("/v1/marketplace");

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8787/v1/marketplace",
      expect.anything(),
    );
  });
});

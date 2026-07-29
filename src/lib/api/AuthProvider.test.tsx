// File responsibility: unit tests for AuthProvider — auth flow, dev bypass, 401 handling, events.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import React from "react";
import { AuthProvider, AuthContext, type AuthContextValue } from "./AuthProvider";
import { triggerAuthInvalidated, onAuthInvalidated, __resetAuthEventHandler } from "./auth-events";
import { getApiAccessToken, setApiAccessToken } from "./session-token";

// ── Env mock (getters consult globalThis so tests can change values) ──────────
const ENV_KEY = "__AUTH_TEST";
vi.mock("@/lib/env", () => ({
  env: {
    get dataSource() {
      return ((globalThis as Record<string, unknown>)[`${ENV_KEY}_DATA_SOURCE`] as string) ?? "mock";
    },
    get devToken() {
      return ((globalThis as Record<string, unknown>)[`${ENV_KEY}_DEV_TOKEN`] as string) ?? "";
    },
    get apiBaseUrl() {
      return "http://localhost:8787";
    },
  },
}));

// ── Telegram SDK mock ────────────────────────────────────────────────────────
vi.mock("@telegram-apps/sdk", () => ({
  retrieveRawInitData: vi.fn(),
}));

import { retrieveRawInitData } from "@telegram-apps/sdk";

// ── test helpers ──────────────────────────────────────────────────────────────
function renderProvider() {
  let contextValue: AuthContextValue | undefined;
  render(
    <AuthProvider>
      <AuthContext.Consumer>
        {(v) => {
          contextValue = v;
          return null;
        }}
      </AuthContext.Consumer>
    </AuthProvider>,
  );
  return () => contextValue;
}

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
    headers: new Headers(),
    statusText: status === 200 ? "OK" : "Error",
  } as unknown as Response);
}

const VALID_USER = {
  id: "123",
  displayName: "Test",
  role: "investor" as const,
  walletAddress: null,
  onboarded: true,
  useTelegramTheme: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  (globalThis as unknown as Record<string, unknown>)[`${ENV_KEY}_DATA_SOURCE`] = "api";
  (globalThis as unknown as Record<string, unknown>)[`${ENV_KEY}_DEV_TOKEN`] = "";
  vi.mocked(retrieveRawInitData).mockReset();
  __resetAuthEventHandler();
  setApiAccessToken(null);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AuthProvider", () => {
  it("api mode + success → token set, status=authenticated", async () => {
    vi.mocked(retrieveRawInitData).mockReturnValue("user=%7B%22id%22%3A1%7D&hash=abc");
    mockFetch(200, { token: "my-jwt", user: VALID_USER, expiresAt: "2026-07-30T12:00:00Z" });

    const getContext = renderProvider();

    await waitFor(() => {
      expect(getContext()?.status).toBe("authenticated");
    });

    expect(getApiAccessToken()).toBe("my-jwt");
    expect(getContext()?.user).toMatchObject({ id: "123", displayName: "Test" });
    expect(getContext()?.error).toBeNull();
  });

  it("api mode + 401 from auth → status=error, no token", async () => {
    vi.mocked(retrieveRawInitData).mockReturnValue("user=1&hash=bad");
    mockFetch(401, { code: "unauthorized", message: "Invalid initData" });

    const getContext = renderProvider();

    await waitFor(() => {
      expect(getContext()?.status).toBe("error");
    });

    expect(getApiAccessToken()).toBeNull();
    expect(getContext()?.error).toBeTruthy();
  });

  it("mock dataSource → does nothing, status=unauthenticated, no fetch", async () => {
    (globalThis as unknown as Record<string, unknown>)[`${ENV_KEY}_DATA_SOURCE`] = "mock";
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const getContext = renderProvider();

    await waitFor(() => {
      expect(getContext()?.status).toBe("unauthenticated");
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(getApiAccessToken()).toBeNull();
  });

  it("devToken set → skips fetch, token set, status=authenticated", async () => {
    (globalThis as unknown as Record<string, unknown>)[`${ENV_KEY}_DEV_TOKEN`] = "dev-jwt-123";
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const getContext = renderProvider();

    await waitFor(() => {
      expect(getContext()?.status).toBe("authenticated");
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(getApiAccessToken()).toBe("dev-jwt-123");
    expect(getContext()?.user).toBeNull();
  });

  it("no initData (outside Telegram) → warn, status=unauthenticated", async () => {
    vi.mocked(retrieveRawInitData).mockImplementation(() => {
      throw new Error("Not in Telegram");
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const getContext = renderProvider();

    await waitFor(() => {
      expect(getContext()?.status).toBe("unauthenticated");
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("No initData available"),
    );
    expect(getApiAccessToken()).toBeNull();
  });
});

describe("auth-events", () => {
  it("triggerAuthInvalidated calls registered handler", () => {
    const handler = vi.fn();
    onAuthInvalidated(handler);
    triggerAuthInvalidated();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("triggerAuthInvalidated no-ops when no handler registered", () => {
    expect(() => triggerAuthInvalidated()).not.toThrow();
  });

});

describe("HTTP client 401 handling", () => {
  it("401 response clears token and triggers auth-invalidated", async () => {
    const handler = vi.fn();
    onAuthInvalidated(handler);
    setApiAccessToken("old-token");
    expect(getApiAccessToken()).toBe("old-token");

    const { createHttpClient } = await import("./http/client");
    const client = createHttpClient({ baseUrl: "http://localhost:8787", getToken: () => "old-token" });

    mockFetch(401, { code: "unauthorized", message: "Expired" });

    const err = await client.get("/v1/portfolio").catch((e: unknown) => e);
    expect(err).toBeDefined();
    expect(getApiAccessToken()).toBeNull();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("non-401 error does not clear token", async () => {
    setApiAccessToken("still-valid");
    const handler = vi.fn();
    onAuthInvalidated(handler);

    const { createHttpClient } = await import("./http/client");
    const client = createHttpClient({ baseUrl: "http://localhost:8787", getToken: () => "still-valid" });

    mockFetch(404, { code: "not_found", message: "Missing" });

    await client.get("/v1/properties/bad").catch(() => {});
    expect(getApiAccessToken()).toBe("still-valid");
    expect(handler).not.toHaveBeenCalled();
  });
});

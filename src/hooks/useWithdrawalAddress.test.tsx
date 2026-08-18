// File responsibility: unit tests for useWithdrawalAddress — mock branch (auth store
// update, verified reset) and HTTP branch (POST /v1/me/withdrawal-address, error paths).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { setApiAccessToken } from "@/lib/api/session-token";
import { useWithdrawalAddress } from "@/hooks/useWithdrawalAddress";
import type { UserProfile } from "@/types/user";

const ADDRESS = "EQHq2VsN7yKwTp8rUy4mL0kHbZ6sAeF4oVgB8uTr9pXkMdH5";

// ── Env mock (getters consult globalThis so tests can switch the data source) ──
const ENV_KEY = "__WITHDRAWAL_TEST";
vi.mock("@/lib/env", () => ({
  env: {
    get dataSource() {
      return (
        ((globalThis as Record<string, unknown>)[`${ENV_KEY}_DATA_SOURCE`] as
          | string
          | undefined) ?? "mock"
      );
    },
    get apiBaseUrl() {
      return (
        ((globalThis as Record<string, unknown>)[`${ENV_KEY}_API_BASE_URL`] as
          | string
          | undefined) ?? "http://localhost:8787"
      );
    },
  },
}));

const establishSession = vi.fn();
vi.mock("@/hooks/useApiAuth", () => ({
  useApiAuth: () => ({ establishSession }),
}));

function baseUser(over: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "user-42",
    displayName: "Test User",
    role: "investor",
    walletAddress: null,
    withdrawalAddress: null,
    withdrawalAddressVerified: false,
    onboarded: true,
    profileCompleted: true,
    useTelegramTheme: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

/** Minimal harness: renders the hook's surface and exposes a save trigger. */
function Harness() {
  const { saveAddress, pending, error } = useWithdrawalAddress();
  const [result, setResult] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        data-testid="save"
        onClick={() => {
          void saveAddress(ADDRESS)
            .then((u) => setResult(`saved:${u.withdrawalAddress}`))
            .catch(() => {});
        }}
      >
        save
      </button>
      <span data-testid="pending">{String(pending)}</span>
      <span data-testid="error">{error ?? "none"}</span>
      <span data-testid="result">{result ?? "none"}</span>
    </div>
  );
}

let fetchSpy: ReturnType<typeof vi.spyOn>;

function mockFetch(status: number, body: unknown) {
  fetchSpy.mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as unknown as Response);
}

function setDataSource(source: "mock" | "api") {
  (globalThis as Record<string, unknown>)[`${ENV_KEY}_DATA_SOURCE`] = source;
}

describe("useWithdrawalAddress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi.spyOn(globalThis, "fetch");
    setApiAccessToken(null);
    setDataSource("mock");
    useAuthStore.setState({ user: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mock branch: saves the address into the auth store and resets verification", async () => {
    // A previously verified address on record — the save must invalidate it.
    useAuthStore.setState({
      user: baseUser({
        withdrawalAddress: "EQOTHER",
        withdrawalAddressVerified: true,
      }),
    });

    render(<Harness />);
    fireEvent.click(screen.getByTestId("save"));

    await waitFor(() => {
      const user = useAuthStore.getState().user;
      expect(user?.withdrawalAddress).toBe(ADDRESS);
      expect(user?.withdrawalAddressVerified).toBe(false);
    });
    expect(await screen.findByTestId("result")).toHaveTextContent(
      `saved:${ADDRESS}`,
    );
    // Mock branch never touches the network or the session.
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(establishSession).not.toHaveBeenCalled();
  });

  it("mock branch: rejects with Not signed in when no user is in the store", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId("save"));
    expect(await screen.findByTestId("error")).toHaveTextContent(
      "Not signed in",
    );
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("http branch: POSTs the address and establishes the returned session user", async () => {
    setDataSource("api");
    setApiAccessToken("test-token");
    const updated = baseUser({ withdrawalAddress: ADDRESS });
    mockFetch(200, { user: updated });

    render(<Harness />);
    fireEvent.click(screen.getByTestId("save"));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:8787/v1/me/withdrawal-address",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
            "Content-Type": "application/json",
          }),
        }),
      );
    });
    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0] ?? [];
    expect(JSON.parse(String(init?.body))).toEqual({ address: ADDRESS });
    expect(establishSession).toHaveBeenCalledWith(updated);
    expect(await screen.findByTestId("result")).toHaveTextContent(
      `saved:${ADDRESS}`,
    );
  });

  it("http branch: surfaces the server message and error state on 4xx", async () => {
    setDataSource("api");
    setApiAccessToken("test-token");
    mockFetch(400, { message: "invalid TON address" });

    render(<Harness />);
    fireEvent.click(screen.getByTestId("save"));

    expect(await screen.findByTestId("error")).toHaveTextContent(
      "invalid TON address",
    );
    expect(establishSession).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("http branch: falls back to the HTTP status when the error body is not JSON", async () => {
    setDataSource("api");
    setApiAccessToken("test-token");
    fetchSpy.mockResolvedValue({
      status: 500,
      ok: false,
      json: async () => {
        throw new Error("not json");
      },
    } as unknown as Response);

    render(<Harness />);
    fireEvent.click(screen.getByTestId("save"));

    expect(await screen.findByTestId("error")).toHaveTextContent("HTTP 500");
  });

  it("http branch: requires a session token", async () => {
    setDataSource("api");
    setApiAccessToken(null);

    render(<Harness />);
    fireEvent.click(screen.getByTestId("save"));

    expect(await screen.findByTestId("error")).toHaveTextContent(
      "Not signed in",
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

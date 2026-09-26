import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuthStore } from "@/stores/auth.store";
import type { UserProfile } from "@/types/user";

vi.mock("@/lib/env", () => ({ env: { botUsername: "TestBot" } }));

import { useCoOwnInvite } from "@/hooks/useCoOwnInvite";

const user: UserProfile = {
  id: "u1",
  displayName: "Demo",
  role: "investor",
  walletAddress: null,
  withdrawalAddress: null,
  withdrawalAddressVerified: false,
  onboarded: true,
  profileCompleted: true,
  useTelegramTheme: false,
  createdAt: "2026-01-01T00:00:00Z",
};

describe("useCoOwnInvite", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useAuthStore.getState().setUser(user);
  });

  afterEach(() => {
    vi.useRealTimers();
    useAuthStore.getState().setUser(null);
    vi.unstubAllGlobals();
  });

  it("builds the estate-scoped co-own link for a signed-in user", () => {
    const { result } = renderHook(() => useCoOwnInvite("re-128862"));
    expect(result.current.canShare).toBe(true);
    expect(result.current.coOwnLink).toBe("https://t.me/TestBot?startapp=coown_re-128862_ref_u1");
  });

  it("reports login state separately from link availability", () => {
    const { result } = renderHook(() => useCoOwnInvite("re-128862"));
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.canShare).toBe(true);
  });

  it("logged-in but blank estate is unshareable yet still logged in", () => {
    const { result } = renderHook(() => useCoOwnInvite("   "));
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.canShare).toBe(false);
    expect(result.current.coOwnLink).toBeNull();
  });

  it("reports not-shareable without a user and never throws on copy", async () => {
    useAuthStore.getState().setUser(null);
    const { result } = renderHook(() => useCoOwnInvite("re-128862"));
    expect(result.current.canShare).toBe(false);
    expect(result.current.coOwnLink).toBeNull();
    await act(async () => {
      await result.current.copyCoOwn();
    });
    expect(result.current.copied).toBe(false);
  });

  it("share prefers navigator.share with the co-own URL", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });
    const { result } = renderHook(() => useCoOwnInvite("re-128862"));
    await act(async () => {
      await result.current.shareCoOwn();
    });
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://t.me/TestBot?startapp=coown_re-128862_ref_u1" }),
    );
  });

  it("copy writes the link and shows copied feedback for 2s", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const { result } = renderHook(() => useCoOwnInvite("re-128862"));
    await act(async () => {
      await result.current.copyCoOwn();
    });
    expect(writeText).toHaveBeenCalledWith("https://t.me/TestBot?startapp=coown_re-128862_ref_u1");
    expect(result.current.copied).toBe(true);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.copied).toBe(false);
  });

  it("copy without a clipboard fails silently", async () => {
    vi.stubGlobal("navigator", {});
    const { result } = renderHook(() => useCoOwnInvite("re-128862"));
    await act(async () => {
      await result.current.copyCoOwn();
    });
    expect(result.current.copied).toBe(false);
  });
});

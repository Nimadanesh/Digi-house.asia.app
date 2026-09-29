import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuthStore } from "@/stores/auth.store";
import type { UserProfile } from "@/types/user";

vi.mock("@/lib/env", () => ({ env: { botUsername: "TestBot" } }));

import { useShareOwnership } from "@/hooks/useShareOwnership";

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

describe("useShareOwnership", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useAuthStore.getState().setUser(user);
  });

  afterEach(() => {
    vi.useRealTimers();
    useAuthStore.getState().setUser(null);
    vi.unstubAllGlobals();
  });

  it("builds the ownership-share link for the exact estate", () => {
    const { result } = renderHook(() => useShareOwnership("re-128862", "Grand Villa"));
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.canShare).toBe(true);
    expect(result.current.shareLink).toBe("https://t.me/TestBot?startapp=own_re-128862_ref_u1");
  });

  it("reports logged-out without a user and never throws", async () => {
    useAuthStore.getState().setUser(null);
    const { result } = renderHook(() => useShareOwnership("re-128862", "Grand Villa"));
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.shareLink).toBeNull();
    await act(async () => {
      await result.current.copyOwnership();
    });
    expect(result.current.copied).toBe(false);
  });

  it("share prefers navigator.share with the estate URL", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });
    const { result } = renderHook(() => useShareOwnership("re-128862", "Grand Villa"));
    await act(async () => {
      await result.current.shareOwnership();
    });
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://t.me/TestBot?startapp=own_re-128862_ref_u1" }),
    );
  });

  it("copy writes the link and shows copied feedback for 2s", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const { result } = renderHook(() => useShareOwnership("re-128862", "Grand Villa"));
    await act(async () => {
      await result.current.copyOwnership();
    });
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("https://t.me/TestBot?startapp=own_re-128862_ref_u1"),
    );
    expect(result.current.copied).toBe(true);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.copied).toBe(false);
  });
});

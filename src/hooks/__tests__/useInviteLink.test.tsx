import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuthStore } from "@/stores/auth.store";
import type { UserProfile } from "@/types/user";

vi.mock("@/lib/env", () => ({ env: { botUsername: "TestBot" } }));

import { useInviteLink } from "@/hooks/useInviteLink";

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

describe("useInviteLink", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useAuthStore.getState().setUser(user);
  });

  afterEach(() => {
    vi.useRealTimers();
    useAuthStore.getState().setUser(null);
    vi.unstubAllGlobals();
  });

  it("builds the referral link for a signed-in user", () => {
    const { result } = renderHook(() => useInviteLink());
    expect(result.current.canInvite).toBe(true);
    expect(result.current.inviteLink).toBe("https://t.me/TestBot?startapp=ref_u1");
  });

  it("reports not-invitable without a user and never throws on copy", async () => {
    useAuthStore.getState().setUser(null);
    const { result } = renderHook(() => useInviteLink());
    expect(result.current.canInvite).toBe(false);
    expect(result.current.inviteLink).toBeNull();
    await act(async () => {
      await result.current.copyInvite();
    });
    expect(result.current.copied).toBe(false);
  });

  it("copy writes the link and shows copied feedback for 2s", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const { result } = renderHook(() => useInviteLink());
    await act(async () => {
      await result.current.copyInvite();
    });
    expect(writeText).toHaveBeenCalledWith("https://t.me/TestBot?startapp=ref_u1");
    expect(result.current.copied).toBe(true);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.copied).toBe(false);
  });

  it("copy without a clipboard fails silently", async () => {
    vi.stubGlobal("navigator", {});
    const { result } = renderHook(() => useInviteLink());
    await act(async () => {
      await result.current.copyInvite();
    });
    expect(result.current.copied).toBe(false);
  });
});

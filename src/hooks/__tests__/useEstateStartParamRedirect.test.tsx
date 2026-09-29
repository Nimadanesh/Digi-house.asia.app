import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSettingsStore } from "@/stores/settings.store";
import { useEstateStartParamRedirect } from "@/hooks/useEstateStartParamRedirect";

const pathRef = vi.hoisted(() => ({ value: "/home" }));
const replaceMock = vi.hoisted(() => vi.fn());
const launchRef = vi.hoisted(() => ({
  value: undefined as undefined | { tgWebAppStartParam?: string },
  throws: false,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathRef.value,
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, back: vi.fn() }),
}));

vi.mock("@/lib/telegram/TelegramProvider", () => ({
  useTelegramReady: () => true,
}));

vi.mock("@/lib/telegram/signals", () => ({
  retrieveLaunchParams: () => {
    if (launchRef.throws) throw new Error("not in Telegram");
    return launchRef.value ?? {};
  },
}));

describe("useEstateStartParamRedirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pathRef.value = "/home";
    launchRef.value = undefined;
    launchRef.throws = false;
    useSettingsStore.setState({ onboarded: true });
  });

  it("lands a co-own recipient on the shared estate", () => {
    launchRef.value = { tgWebAppStartParam: "coown_re-128862_ref_u1" };
    renderHook(() => useEstateStartParamRedirect());
    expect(replaceMock).toHaveBeenCalledWith("/property/re-128862");
  });

  it("lands an ownership-share recipient on the shared estate", () => {
    launchRef.value = { tgWebAppStartParam: "own_re-128862_ref_u1" };
    renderHook(() => useEstateStartParamRedirect());
    expect(replaceMock).toHaveBeenCalledWith("/property/re-128862");
  });

  it("does not redirect without a start_param", () => {
    renderHook(() => useEstateStartParamRedirect());
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("waits for onboarding before redirecting", () => {
    useSettingsStore.setState({ onboarded: false });
    launchRef.value = { tgWebAppStartParam: "coown_re-128862_ref_u1" };
    const { rerender } = renderHook(() => useEstateStartParamRedirect());
    expect(replaceMock).not.toHaveBeenCalled();
    useSettingsStore.setState({ onboarded: true });
    rerender();
    expect(replaceMock).toHaveBeenCalledWith("/property/re-128862");
  });

  it("does not hijack in-app navigation away from the landing route", () => {
    pathRef.value = "/marketplace";
    launchRef.value = { tgWebAppStartParam: "coown_re-128862_ref_u1" };
    renderHook(() => useEstateStartParamRedirect());
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("ignores unknown or malformed share params (never a generic destination)", () => {
    launchRef.value = { tgWebAppStartParam: "coown_re-does-not-exist_ref_u1" };
    renderHook(() => useEstateStartParamRedirect());
    expect(replaceMock).not.toHaveBeenCalled();
  });
});

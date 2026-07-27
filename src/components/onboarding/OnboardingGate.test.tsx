import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";

const replace = vi.fn();
let pathname = "/home";
let onboarded = false;
let onboardingReplay = false;
let hasHydrated = true;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => pathname,
}));

vi.mock("@/stores/settings.store", () => {
  const store = {
    persist: {
      hasHydrated: () => hasHydrated,
      onFinishHydration: (cb: () => void) => {
        if (!hasHydrated) {
          // not hydrated — no auto finish in unit tests unless hasHydrated flips
        }
        void cb;
        return () => {};
      },
    },
  };
  const useSettingsStore = Object.assign(
    (sel: (s: { onboarded: boolean }) => unknown) => sel({ onboarded }),
    { persist: store.persist },
  );
  return { useSettingsStore };
});

vi.mock("@/stores/ui.store", () => ({
  useUiStore: (sel: (s: { onboardingReplay: boolean }) => unknown) =>
    sel({ onboardingReplay }),
}));

describe("OnboardingGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pathname = "/home";
    onboarded = false;
    onboardingReplay = false;
    hasHydrated = true;
  });

  it("redirects to onboarding when not onboarded", async () => {
    render(
      <OnboardingGate>
        <div>App content</div>
      </OnboardingGate>,
    );
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("allows onboarding route when not onboarded", async () => {
    pathname = "/onboarding";
    render(
      <OnboardingGate>
        <div data-testid="child">Onboarding UI</div>
      </OnboardingGate>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects away from onboarding when already onboarded", async () => {
    onboarded = true;
    pathname = "/onboarding";
    render(
      <OnboardingGate>
        <div>Onboarding UI</div>
      </OnboardingGate>,
    );
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/home");
    });
  });

  it("allows onboarding when onboarded and onboardingReplay is set", async () => {
    onboarded = true;
    onboardingReplay = true;
    pathname = "/onboarding";
    render(
      <OnboardingGate>
        <div data-testid="child">Onboarding UI</div>
      </OnboardingGate>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("shows loading skeleton while store hydrates", () => {
    hasHydrated = false;
    render(
      <OnboardingGate>
        <div>App</div>
      </OnboardingGate>,
    );
    expect(screen.getByTestId("onboarding-gate-loading")).toBeInTheDocument();
  });
});

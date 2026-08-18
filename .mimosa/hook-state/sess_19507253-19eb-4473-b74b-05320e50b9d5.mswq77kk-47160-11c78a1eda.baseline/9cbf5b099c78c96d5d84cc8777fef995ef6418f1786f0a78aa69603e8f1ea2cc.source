import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/onboarding",
}));

// The Braille Flipwave splash is WebGL-only; stub it to complete immediately so the
// carousel is reached. The real component is exercised visually on localhost.
vi.mock("@/components/onboarding/OnboardingLoader", async () => {
  const { useEffect } = await import("react");
  return {
    OnboardingLoader: ({ onComplete }: { onComplete?: () => void }) => {
      useEffect(() => {
        const t = window.setTimeout(() => onComplete?.(), 0);
        return () => window.clearTimeout(t);
      }, [onComplete]);
      return <div data-testid="onboarding-loader-mock" />;
    },
  };
});

let mainHandler: (() => void | Promise<void>) | null = null;
const haptics = { impact: vi.fn(), notification: vi.fn(), selection: vi.fn() };
const mainButton = {
  setParams: vi.fn(),
  hide: vi.fn(),
  onClick: vi.fn((fn: () => void | Promise<void>) => {
    mainHandler = fn;
    return () => {
      mainHandler = null;
    };
  }),
};
const backButton = {
  show: vi.fn(),
  hide: vi.fn(),
  onClick: vi.fn(() => () => {}),
};

vi.mock("@/hooks/useTelegram", () => ({
  useTelegram: () => ({
    ready: true,
    isDark: true,
    viewport: { width: 390, height: 800, stableHeight: 800, isExpanded: true },
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
    backButton,
    mainButton,
    haptics,
    themeParams: {},
  }),
}));

const setOnboarded = vi.fn();
const setMainButtonActive = vi.fn();
const setOnboardingReplay = vi.fn();
vi.mock("@/hooks/useMarkOnboarded", () => ({
  useMarkOnboarded: () => () => {
    setOnboarded(true);
  },
}));
vi.mock("@/stores/ui.store", () => ({
  useUiStore: (
    sel: (s: {
      setMainButtonActive: (v: boolean) => void;
      setOnboardingReplay: (v: boolean) => void;
    }) => unknown,
  ) => sel({ setMainButtonActive, setOnboardingReplay }),
}));

import OnboardingPage from "@/app/(app)/onboarding/page";
import { ONBOARDING_SLIDES } from "@/lib/onboarding-slides";
import { useAuthStore } from "@/stores/auth.store";

async function passSplash() {
  await screen.findByTestId("onboarding-skip");
}

describe("Onboarding page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mainHandler = null;
    useAuthStore.setState({ user: null });
  });

  it("shows the splash first, then the first slide Fable copy + Skip", async () => {
    render(<OnboardingPage />);
    expect(screen.getByTestId("onboarding-page")).toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-skip")).not.toBeInTheDocument();
    await passSplash();
    expect(screen.getByText(ONBOARDING_SLIDES[0]!.headline)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_SLIDES[0]!.subtitle)).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-skip")).toBeInTheDocument();
  });

  it("wires MainButton Get Started on last slide; Continue earlier", async () => {
    render(<OnboardingPage />);
    await passSplash();
    await waitFor(() => {
      expect(mainButton.setParams).toHaveBeenCalledWith(
        expect.objectContaining({ text: "Continue" }),
      );
    });
    fireEvent.click(screen.getByRole("tab", { name: "Slide 3" }));
    await waitFor(() => {
      expect(mainButton.setParams).toHaveBeenCalledWith(
        expect.objectContaining({ text: "Get Started" }),
      );
    });
    expect(setMainButtonActive).toHaveBeenCalledWith(true);
  });

  it("dots navigate between slides and show in-page Get Started on last", async () => {
    render(<OnboardingPage />);
    await passSplash();
    fireEvent.click(screen.getByRole("tab", { name: "Slide 3" }));
    expect(screen.getByTestId("onboarding-slide-sell")).toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-trust")).not.toBeInTheDocument();
    expect(screen.getByTestId("onboarding-start")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("onboarding-start"));
    expect(setOnboarded).toHaveBeenCalledWith(true);
    expect(replace).toHaveBeenCalledWith("/home");
  });

  it("Skip completes onboarding and routes home", async () => {
    render(<OnboardingPage />);
    await passSplash();
    fireEvent.click(screen.getByTestId("onboarding-skip"));
    expect(setOnboarded).toHaveBeenCalledWith(true);
    expect(setOnboardingReplay).toHaveBeenCalledWith(false);
    expect(replace).toHaveBeenCalledWith("/home");
  });

  it("routes to /profile-setup after onboarding when profile not completed", async () => {
    useAuthStore.setState({
      user: {
        id: "user-1",
        displayName: "Demo Investor",
        username: "demoinvestor",
        role: "investor",
        walletAddress: null,
        onboarded: false,
        profileCompleted: false,
        useTelegramTheme: false,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
    render(<OnboardingPage />);
    await passSplash();
    fireEvent.click(screen.getByRole("tab", { name: "Slide 3" }));
    fireEvent.click(screen.getByTestId("onboarding-start"));
    expect(setOnboarded).toHaveBeenCalledWith(true);
    expect(replace).toHaveBeenCalledWith("/profile-setup");
  });

  it("MainButton Get Started completes onboarding", async () => {
    render(<OnboardingPage />);
    await passSplash();
    fireEvent.click(screen.getByRole("tab", { name: "Slide 3" }));
    await act(async () => {
      await mainHandler?.();
    });
    await waitFor(() => {
      expect(setOnboarded).toHaveBeenCalledWith(true);
      expect(replace).toHaveBeenCalledWith("/home");
    });
  });

  it("does not prompt wallet connect", async () => {
    render(<OnboardingPage />);
    await passSplash();
    expect(screen.queryByText(/connect/i)).not.toBeInTheDocument();
  });
});

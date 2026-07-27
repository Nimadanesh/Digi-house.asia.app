import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/onboarding",
}));

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
vi.mock("@/stores/settings.store", () => ({
  useSettingsStore: (sel: (s: { setOnboarded: (v: boolean) => void; onboarded: boolean }) => unknown) =>
    sel({ setOnboarded, onboarded: false }),
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

describe("Onboarding page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mainHandler = null;
  });

  it("renders first slide Fable copy + Skip", () => {
    render(<OnboardingPage />);
    expect(screen.getByTestId("onboarding-page")).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_SLIDES[0]!.headline)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_SLIDES[0]!.subtitle)).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-skip")).toBeInTheDocument();
  });

  it("wires MainButton Get Started on last slide; Continue earlier", () => {
    render(<OnboardingPage />);
    expect(mainButton.setParams).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Continue" }),
    );
    fireEvent.click(screen.getByRole("tab", { name: "Slide 3" }));
    expect(mainButton.setParams).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Get Started" }),
    );
    expect(setMainButtonActive).toHaveBeenCalledWith(true);
  });

  it("dots navigate between slides and show in-page Get Started on last", () => {
    render(<OnboardingPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Slide 3" }));
    expect(screen.getByTestId("onboarding-slide-sell")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-trust")).toHaveTextContent(
      /demo version and transactions are simulated/i,
    );
    expect(screen.getByTestId("onboarding-start")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("onboarding-start"));
    expect(setOnboarded).toHaveBeenCalledWith(true);
    expect(replace).toHaveBeenCalledWith("/home");
  });

  it("Skip completes onboarding and routes home", async () => {
    render(<OnboardingPage />);
    fireEvent.click(screen.getByTestId("onboarding-skip"));
    expect(setOnboarded).toHaveBeenCalledWith(true);
    expect(setOnboardingReplay).toHaveBeenCalledWith(false);
    expect(replace).toHaveBeenCalledWith("/home");
  });

  it("MainButton Get Started completes onboarding", async () => {
    render(<OnboardingPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Slide 3" }));
    await act(async () => {
      await mainHandler?.();
    });
    await waitFor(() => {
      expect(setOnboarded).toHaveBeenCalledWith(true);
      expect(replace).toHaveBeenCalledWith("/home");
    });
  });

  it("does not prompt wallet connect", () => {
    render(<OnboardingPage />);
    expect(screen.queryByText(/connect/i)).not.toBeInTheDocument();
  });
});

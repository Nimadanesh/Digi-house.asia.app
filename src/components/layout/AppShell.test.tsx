import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useSettingsStore } from "@/stores/settings.store";
import { useUiStore } from "@/stores/ui.store";

const pathRef = vi.hoisted(() => ({ value: "/home" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathRef.value,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/hooks/useTheme", () => ({ useTheme: () => {} }));
vi.mock("@/components/onboarding/OnboardingGate", () => ({
  OnboardingGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/profile/ProfileGate", () => ({
  ProfileGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/settings/SettingsSheet", () => ({ SettingsSheet: () => null }));
vi.mock("@/components/common/ToastHost", () => ({ ToastHost: () => null }));
vi.mock("@/components/layout/Header", () => ({ Header: () => null }));
vi.mock("@/components/layout/AppHeader", () => ({ AppHeader: () => null }));
vi.mock("@/components/layout/BottomTabBar", () => ({ BottomTabBar: () => null }));

import { AppShell } from "@/components/layout/AppShell";

describe("AppShell — shared page transition", () => {
  it("renders the page inside the page-enter wrapper on a tab route", () => {
    render(
      <AppShell>
        <div data-testid="page-stub">home</div>
      </AppShell>,
    );
    const wrapper = screen.getByTestId("page-enter");
    expect(wrapper).toHaveClass("page-enter");
    expect(screen.getByTestId("page-stub")).toBeInTheDocument();
  });

  it("rekeys the wrapper on route change without breaking content", () => {
    const { rerender } = render(
      <AppShell>
        <div data-testid="page-stub">home</div>
      </AppShell>,
    );
    pathRef.value = "/marketplace";
    rerender(
      <AppShell>
        <div data-testid="page-stub">marketplace</div>
      </AppShell>,
    );
    // A fresh wrapper (new key) carries the transition; content renders normally.
    expect(screen.getByTestId("page-enter")).toHaveClass("page-enter");
    expect(screen.getByTestId("page-stub")).toHaveTextContent("marketplace");
  });

  it("chromeless routes still render through the transition wrapper", () => {
    pathRef.value = "/onboarding";
    render(
      <AppShell>
        <div data-testid="page-stub">onboarding</div>
      </AppShell>,
    );
    expect(screen.getByTestId("page-enter")).toBeInTheDocument();
    expect(screen.getByTestId("page-stub")).toBeInTheDocument();
  });

  it("does not mount the demo-mode badge on tab pages (prod strip)", () => {
    pathRef.value = "/home";
    useSettingsStore.setState({ showDemoBadge: true });
    useUiStore.setState({ mainButtonActive: false, stickyCtaVisible: false });
    render(
      <AppShell>
        <div data-testid="page-stub">home</div>
      </AppShell>,
    );
    expect(screen.queryByTestId("demo-mode-badge")).not.toBeInTheDocument();
    expect(screen.queryByText(/demo mode/i)).not.toBeInTheDocument();
  });
});

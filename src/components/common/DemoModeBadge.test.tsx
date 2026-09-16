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

describe("DemoModeBadge — prod strip (zero mounts)", () => {
  it("is absent on tab pages even when the demo preference is on", () => {
    pathRef.value = "/home";
    useSettingsStore.setState({ showDemoBadge: true });
    useUiStore.setState({ mainButtonActive: false, stickyCtaVisible: false });
    render(
      <AppShell>
        <div>home</div>
      </AppShell>,
    );
    expect(screen.queryByTestId("demo-mode-badge")).not.toBeInTheDocument();
    expect(screen.queryByText(/demo mode/i)).not.toBeInTheDocument();
  });

  it("is absent while the property sticky CTA occupies the zone", () => {
    pathRef.value = "/home";
    useSettingsStore.setState({ showDemoBadge: true });
    useUiStore.setState({ mainButtonActive: false, stickyCtaVisible: true });
    render(
      <AppShell>
        <div>home</div>
      </AppShell>,
    );
    expect(screen.queryByTestId("demo-mode-badge")).not.toBeInTheDocument();
  });
});

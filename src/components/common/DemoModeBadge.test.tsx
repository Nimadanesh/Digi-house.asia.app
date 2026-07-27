import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useSettingsStore } from "@/stores/settings.store";
import { useUiStore } from "@/stores/ui.store";

vi.mock("next/navigation", () => ({
  usePathname: () => "/home",
}));

vi.mock("@/hooks/useTelegram", () => ({
  useTelegram: () => ({
    haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
  }),
}));

import { DemoModeBadge } from "@/components/common/DemoModeBadge";

describe("DemoModeBadge", () => {
  beforeEach(() => {
    useSettingsStore.setState({ showDemoBadge: true });
    useUiStore.setState({ settingsOpen: false, mainButtonActive: false });
  });

  it("renders when showDemoBadge is true", () => {
    render(<DemoModeBadge />);
    expect(screen.getByTestId("demo-mode-badge")).toBeInTheDocument();
  });

  it("hides when showDemoBadge is false", () => {
    useSettingsStore.setState({ showDemoBadge: false });
    render(<DemoModeBadge />);
    expect(screen.queryByTestId("demo-mode-badge")).not.toBeInTheDocument();
  });

  it("opens Settings on tap", () => {
    render(<DemoModeBadge />);
    fireEvent.click(screen.getByTestId("demo-mode-badge"));
    expect(useUiStore.getState().settingsOpen).toBe(true);
  });
});

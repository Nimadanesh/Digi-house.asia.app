import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DemoModeBadge } from "@/components/common/DemoModeBadge";
import { useUiStore } from "@/stores/ui.store";

function renderBadge() {
  return render(<DemoModeBadge />);
}

describe("DemoModeBadge — yields to the in-page sticky CTA", () => {
  it("renders when no sticky CTA is visible", () => {
    useUiStore.setState({ mainButtonActive: false, stickyCtaVisible: false });
    renderBadge();
    expect(screen.getByTestId("demo-mode-badge")).toBeInTheDocument();
  });

  it("is hidden while the property sticky CTA occupies the zone (Sell tap fix)", () => {
    useUiStore.setState({ mainButtonActive: false, stickyCtaVisible: true });
    renderBadge();
    expect(screen.queryByTestId("demo-mode-badge")).not.toBeInTheDocument();
  });
});

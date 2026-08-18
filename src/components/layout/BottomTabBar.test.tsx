import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomTabBar } from "@/components/layout/BottomTabBar";

const usePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));
vi.mock("@/lib/telegram/haptics", () => ({
  haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
}));

describe("BottomTabBar — active pill padding/margin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders exactly one active pill, inside the matching tab", () => {
    usePathname.mockReturnValue("/marketplace");
    render(<BottomTabBar />);
    const pills = screen.getAllByTestId("tab-active-pill");
    expect(pills).toHaveLength(1);
    const marketplaceLink = screen.getByRole("link", { name: /marketplace/i });
    expect(marketplaceLink.contains(pills[0]!)).toBe(true);
  });

  it("pill hugs the content wrapper which carries uniform tight padding (PD fix)", () => {
    usePathname.mockReturnValue("/home");
    render(<BottomTabBar />);
    const pill = screen.getByTestId("tab-active-pill");
    // The pill fills the content wrapper (inset-0) — it is no longer full-tab-width.
    expect(pill).toHaveClass("inset-0");
    // The wrapper gives the text the same gap from the pill on every tab.
    const wrapper = pill.parentElement;
    expect(wrapper?.className).toContain("px-2.5");
    expect(wrapper?.className).toContain("py-[5px]");
  });

  it("keeps the tab item sized and rounded as before (h-[50px], rounded-[22px])", () => {
    usePathname.mockReturnValue("/home");
    render(<BottomTabBar />);
    const homeLink = screen.getByRole("link", { name: /home/i });
    expect(homeLink).toHaveClass("h-[50px]");
    expect(homeLink).toHaveClass("rounded-[22px]");
  });

  it("moves the pill when a different tab is active", () => {
    usePathname.mockReturnValue("/earnings");
    render(<BottomTabBar />);
    const pills = screen.getAllByTestId("tab-active-pill");
    expect(pills).toHaveLength(1);
    const earningsLink = screen.getByRole("link", { name: /earnings/i });
    expect(earningsLink.contains(pills[0]!)).toBe(true);
  });
});

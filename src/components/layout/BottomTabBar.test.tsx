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

describe("BottomTabBar — one shared equal-slot indicator", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders exactly one shared pill, not one per tab", () => {
    usePathname.mockReturnValue("/marketplace");
    render(<BottomTabBar />);
    const pills = screen.getAllByTestId("tab-active-pill");
    expect(pills).toHaveLength(1);
    // Sibling of the links, inside the outer capsule — never painted by a button.
    const marketplaceLink = screen.getByRole("link", { name: /marketplace/i });
    expect(marketplaceLink.contains(pills[0]!)).toBe(false);
  });

  it("pill is a quarter of the inner bar with 4px insets and a stadium shape", () => {
    usePathname.mockReturnValue("/home");
    render(<BottomTabBar />);
    const pill = screen.getByTestId("tab-active-pill");
    expect(pill).toHaveClass("top-1");
    expect(pill).toHaveClass("bottom-1");
    expect(pill).toHaveClass("left-1");
    expect(pill).toHaveClass("rounded-full");
    // jsdom serializes division as multiplication — same quarter of the inner bar.
    expect(pill.style.width).toBe("calc(0.25 * (100% - 8px))");
  });

  it("pill moves by slot index: marketplace = 1, earnings = 2", () => {
    usePathname.mockReturnValue("/marketplace");
    const { unmount } = render(<BottomTabBar />);
    expect(screen.getByTestId("tab-active-pill").style.transform).toBe(
      "translateX(calc(100% * 1))",
    );
    unmount();
    usePathname.mockReturnValue("/earnings");
    render(<BottomTabBar />);
    expect(screen.getByTestId("tab-active-pill").style.transform).toBe(
      "translateX(calc(100% * 2))",
    );
  });

  it("buttons stay transparent with equal slots and one-line labels", () => {
    usePathname.mockReturnValue("/home");
    render(<BottomTabBar />);
    for (const name of [/^home$/i, /marketplace/i, /earnings/i, /portfolio/i]) {
      const link = screen.getByRole("link", { name });
      expect(link.className).toContain("bg-transparent");
    }
    const label = screen.getByText("Marketplace");
    expect(label).toHaveClass("whitespace-nowrap");
    expect(label).toHaveClass("text-[11px]");
  });
});

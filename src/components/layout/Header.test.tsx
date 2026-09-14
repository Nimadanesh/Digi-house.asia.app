// Phase 9 Slice 7 — back chevron mirrors in RTL (RED-first).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "@/components/layout/Header";

const usePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/lib/telegram/haptics", () => ({
  haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
}));

describe("Header — back chevron mirrors in RTL", () => {
  beforeEach(() => vi.clearAllMocks());

  it("nested route back button flips direction in RTL", () => {
    usePathname.mockReturnValue("/property/test-x");
    const { container } = render(<Header />);
    const icon = container.querySelector('[data-testid="header-back"] svg');
    expect(icon?.getAttribute("class") ?? "").toMatch(/rtl:rotate-180/);
  });

  it("root routes show no back button", () => {
    usePathname.mockReturnValue("/home");
    render(<Header />);
    expect(screen.queryByTestId("header-back")).not.toBeInTheDocument();
  });
});

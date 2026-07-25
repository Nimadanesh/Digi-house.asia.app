import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/common/EmptyState";

describe("EmptyState — DESIGN_SYSTEM §'Empty state'", () => {
  it("renders the 120px Building2 line illustration with muted color, aria-hidden", () => {
    const { container } = render(<EmptyState title="No holdings" message="msg" />);
    const svg = container.querySelector('svg[class*="lucide-building-2"]') ?? container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("width")).toBe("120");
    expect(svg?.getAttribute("height")).toBe("120");
    expect(svg?.getAttribute("class")).toMatch(/text-muted-foreground/);
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders the H2 headline with the spec'd size (text-[0.9375rem] font-semibold)", () => {
    render(<EmptyState title="No earnings yet" message="msg" />);
    const headline = screen.getByRole("heading", { level: 2 });
    expect(headline).toHaveTextContent("No earnings yet");
    expect(headline).toHaveClass("font-semibold");
    expect(headline.className).toMatch(/text-\[0\.9375rem\]/);
  });

  it("renders the muted message sentence", () => {
    render(<EmptyState title="t" message="Own a slice of a property to see your position here." />);
    expect(screen.getByText("Own a slice of a property to see your position here.")).toHaveClass("text-muted-foreground");
  });

  it("renders the primary action when provided", () => {
    render(
      <EmptyState
        title="t"
        message="m"
        action={<a href="/marketplace" className="bg-primary text-primary-foreground">Explore</a>}
      />,
    );
    const action = screen.getByRole("link", { name: "Explore" });
    expect(action).toHaveClass("bg-primary", "text-primary-foreground");
  });
});
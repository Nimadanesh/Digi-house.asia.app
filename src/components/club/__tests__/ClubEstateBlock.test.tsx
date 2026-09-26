import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClubEstateBlock } from "@/components/club/ClubEstateBlock";

describe("ClubEstateBlock", () => {
  it("stacks icon → title → description → CTA with a functional Club entry", () => {
    const { container } = render(<ClubEstateBlock />);
    const section = screen.getByTestId("club-estate-block");
    expect(section).toBeInTheDocument();
    const html = section.innerHTML;
    const titleAt = html.indexOf("Private Member Benefit");
    const descAt = html.indexOf("This estate may offer");
    const ctaAt = html.indexOf("Explore Club");
    expect(titleAt).toBeGreaterThanOrEqual(0);
    expect(descAt).toBeGreaterThan(titleAt);
    expect(ctaAt).toBeGreaterThan(descAt);
    const cta = screen.getByTestId("club-estate-cta");
    expect(cta).toHaveAttribute("href", "/club");
    expect(cta.className).toMatch(/min-h-\[48px\]/);
    expect(container.textContent).not.toMatch(/\$\d|%/);
  });
});

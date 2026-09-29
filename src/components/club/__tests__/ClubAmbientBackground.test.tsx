import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClubAmbientBackground } from "@/components/club/ClubAmbientBackground";

describe("ClubAmbientBackground", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a decorative, interaction-free canvas background", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    render(<ClubAmbientBackground />);
    const layer = screen.getByTestId("club-ambient");
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer.tagName).toBe("DIV");
    expect(layer.querySelector("canvas")).not.toBeNull();
  });
});

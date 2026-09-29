import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClubPortfolioStrip } from "@/components/club/ClubPortfolioStrip";

describe("ClubPortfolioStrip", () => {
  it("links private-tier holdings to the Club page", () => {
    render(<ClubPortfolioStrip investedUsd={1_500_000} />);
    const strip = screen.getByTestId("club-portfolio-strip");
    expect(strip).toHaveTextContent("Private");
    expect(strip).toHaveAttribute("href", "/club");
  });

  it("reflects the derived tier and next-unlock progress", () => {
    render(<ClubPortfolioStrip investedUsd={250_000} />);
    const strip = screen.getByTestId("club-portfolio-strip");
    expect(strip).toHaveTextContent("Standard");
    expect(strip).toHaveTextContent(/to unlock Private/);
    expect(strip).toHaveAttribute("href", "/club");
  });
});

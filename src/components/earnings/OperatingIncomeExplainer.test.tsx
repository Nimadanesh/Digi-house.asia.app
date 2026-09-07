import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OperatingIncomeExplainer } from "@/components/earnings/OperatingIncomeExplainer";

describe("OperatingIncomeExplainer — income origin without a second engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("discloses the five-step chain collapsed, with an estate pointer", () => {
    render(<OperatingIncomeExplainer />);
    expect(screen.getByTestId("income-origin")).toBeInTheDocument();
    // Progressive disclosure: steps hidden until opened (no wall of formulas).
    expect(screen.queryByText("Net operating profit")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("income-origin-toggle"));
    expect(screen.getByText("Gross rental revenue")).toBeInTheDocument();
    expect(screen.getByText("Operating costs")).toBeInTheDocument();
    expect(screen.getByText("Net operating profit")).toBeInTheDocument();
    expect(screen.getByText("Owner allocation")).toBeInTheDocument();
    expect(screen.getByText("Your income")).toBeInTheDocument();
    expect(screen.getByText(/Estate tab/)).toBeInTheDocument();
  });
});

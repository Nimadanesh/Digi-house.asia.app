import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusPill } from "@/components/common/StatusPill";

describe("StatusPill — clean status capsule (no transparency badges)", () => {
  it("a Paid pill renders only the finance-colored capsule", () => {
    render(<StatusPill label="Paid" variant="success" />);
    const paid = screen.getByText("Paid");
    expect(paid).toHaveClass("text-success", "bg-success/12");
    expect(screen.queryByText("simulated")).not.toBeInTheDocument();
  });

  it("a Pending pill renders 'Pending' with the warning variant", () => {
    render(<StatusPill label="Pending" variant="warning" />);
    const pending = screen.getByText("Pending");
    expect(pending).toHaveClass("text-warning", "bg-warning/12");
    expect(screen.queryByText("simulated")).not.toBeInTheDocument();
  });

  it("a danger pill renders the danger variant", () => {
    render(<StatusPill label="Closed" variant="danger" />);
    expect(screen.getByText("Closed")).toHaveClass("text-danger", "bg-danger/10");
  });
});

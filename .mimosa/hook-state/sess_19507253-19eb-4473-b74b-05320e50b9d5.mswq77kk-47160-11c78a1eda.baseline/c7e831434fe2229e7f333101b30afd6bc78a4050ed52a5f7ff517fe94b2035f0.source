import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusPill } from "@/components/common/StatusPill";

describe("StatusPill — MVP honesty contract", () => {
  it("a Paid pill with simulated renders BOTH the Paid pill and the muted 'simulated' capsule", () => {
    render(<StatusPill label="Paid" variant="success" simulated />);
    // The finance-colored pill:
    const paid = screen.getByText("Paid");
    expect(paid).toHaveClass("text-success", "bg-success/12");
    // The muted sibling simulated badge (never finance-colored):
    const sim = screen.getByText("simulated");
    expect(sim).toHaveClass("text-muted-foreground", "bg-muted");
    expect(sim).not.toHaveClass("text-success");
    expect(sim).not.toHaveClass("text-danger");
  });

  it("a Pending pill renders 'Pending' with the warning variant and NO 'simulated' badge", () => {
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
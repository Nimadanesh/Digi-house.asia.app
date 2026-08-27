import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { IncomeTimeline } from "@/components/earnings/IncomeTimeline";
import type { EarningsEntry } from "@/types/earnings";

vi.mock("@/hooks/useSharedNowMs", () => ({
  useSharedNowMs: () => 1_700_000_000_000,
}));

const base: Omit<EarningsEntry, "id" | "weekOf" | "amountUsd" | "status"> = {
  userId: "u1",
  propertyId: "prop-a",
  tonAmount: 0,
  shareRatio: 0.01,
};

describe("IncomeTimeline — Paid → Accruing → Next estimated", () => {
  const entries: EarningsEntry[] = [
    { ...base, id: "e1", weekOf: "2026-07-13T00:00:00Z", amountUsd: 1000, status: "paid" },
    { ...base, id: "e2", weekOf: "2026-07-13T00:00:00Z", amountUsd: 500, status: "paid" },
    { ...base, id: "e3", weekOf: "2026-07-20T00:00:00Z", amountUsd: 400, status: "pending" },
  ];

  it("sums the newest fully-paid week, the pending week, and shows the next estimate", () => {
    render(<IncomeTimeline entries={entries} projectedNextUsd={475} />);
    expect(screen.getByTestId("income-timeline")).toBeInTheDocument();
    // Paid = sum of both paid entries in the same week: 1_500¢.
    expect(screen.getByTestId("timeline-paid")).toHaveTextContent("$15.00");
    // Accruing = pending entries only.
    expect(screen.getByTestId("timeline-accruing")).toHaveTextContent("$4.00");
    // Next estimated uses the passed repo figure.
    expect(screen.getByTestId("timeline-next")).toHaveTextContent("$4.75");
    expect(screen.getByTestId("timeline-next")).toHaveTextContent(/sun/i);
  });

  it("shows zero for accruing when nothing is pending", () => {
    const paidOnly: EarningsEntry[] = [
      { ...base, id: "e1", weekOf: "2026-07-13T00:00:00Z", amountUsd: 1000, status: "paid" },
    ];
    render(<IncomeTimeline entries={paidOnly} projectedNextUsd={475} />);
    expect(screen.getByTestId("timeline-accruing")).toHaveTextContent("$0.00");
    expect(screen.getByTestId("timeline-paid")).toHaveTextContent("$10.00");
  });

  it("shows an em dash for the paid week when nothing has been paid yet", () => {
    const nonePaid: EarningsEntry[] = [
      { ...base, id: "e3", weekOf: "2026-07-20T00:00:00Z", amountUsd: 400, status: "pending" },
    ];
    render(<IncomeTimeline entries={nonePaid} projectedNextUsd={475} />);
    expect(screen.getByTestId("timeline-paid")).toHaveTextContent("—");
  });
});
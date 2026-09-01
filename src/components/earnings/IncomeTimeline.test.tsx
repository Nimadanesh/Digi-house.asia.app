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

describe("IncomeTimeline — Paid → Accrued → Expected (status words only)", () => {
  const entries: EarningsEntry[] = [
    { ...base, id: "e1", weekOf: "2026-07-13T00:00:00Z", amountUsd: 1000, status: "paid" },
    { ...base, id: "e2", weekOf: "2026-07-13T00:00:00Z", amountUsd: 500, status: "paid" },
    { ...base, id: "e3", weekOf: "2026-07-20T00:00:00Z", amountUsd: 400, status: "pending" },
  ];

  it("shows Paid (actual week total), Accrued (repo figure), Expected (pending-only + date)", () => {
    render(
      <IncomeTimeline entries={entries} projectedNextUsd={475} accruedUsd={1234} />,
    );
    expect(screen.getByTestId("income-timeline")).toBeInTheDocument();
    // Paid = sum of both paid entries in the same week: 1_500¢.
    expect(screen.getByTestId("timeline-paid")).toHaveTextContent("$15.00");
    // Accrued comes from the repo accrued-unpaid figure, not pending entries.
    expect(screen.getByTestId("timeline-accrued")).toHaveTextContent("$12.34");
    expect(screen.getByTestId("timeline-accrued")).toHaveTextContent(
      "paid with next distribution",
    );
    // Expected uses the passed repo figure + the Sunday display date.
    expect(screen.getByTestId("timeline-next")).toHaveTextContent("$4.75");
    expect(screen.getByTestId("timeline-next")).toHaveTextContent(/sun/i);
    // Status words only — no frequency claims.
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("Accrued")).toBeInTheDocument();
    expect(screen.getByText("Expected")).toBeInTheDocument();
  });

  it("hides the Accrued row when no lock/yield data exists (never a fake zero)", () => {
    const paidOnly: EarningsEntry[] = [
      { ...base, id: "e1", weekOf: "2026-07-13T00:00:00Z", amountUsd: 1000, status: "paid" },
    ];
    render(<IncomeTimeline entries={paidOnly} projectedNextUsd={475} />);
    expect(screen.queryByTestId("timeline-accrued")).not.toBeInTheDocument();
    expect(screen.getByTestId("timeline-paid")).toHaveTextContent("$10.00");
  });

  it("hides the Expected row when nothing is pending (never a fake $0 Expected)", () => {
    const paidOnly: EarningsEntry[] = [
      { ...base, id: "e1", weekOf: "2026-07-13T00:00:00Z", amountUsd: 1000, status: "paid" },
    ];
    render(<IncomeTimeline entries={paidOnly} projectedNextUsd={0} accruedUsd={500} />);
    expect(screen.queryByTestId("timeline-next")).not.toBeInTheDocument();
    expect(screen.getByTestId("timeline-accrued")).toHaveTextContent("$5.00");
  });

  it("shows an em dash for the paid week when nothing has been paid yet", () => {
    const nonePaid: EarningsEntry[] = [
      { ...base, id: "e3", weekOf: "2026-07-20T00:00:00Z", amountUsd: 400, status: "pending" },
    ];
    render(<IncomeTimeline entries={nonePaid} projectedNextUsd={475} accruedUsd={100} />);
    expect(screen.getByTestId("timeline-paid")).toHaveTextContent("—");
  });
});

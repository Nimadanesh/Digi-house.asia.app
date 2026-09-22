import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { DistributionStatus } from "@/components/earnings/DistributionStatus";
import type { Withdrawal } from "@/types/withdrawal";

function withdrawal(overrides: Partial<Withdrawal>): Withdrawal {
  return {
    id: "wd-1",
    amountUsd: 10_000,
    feeUsd: 100,
    netUsd: 9_900,
    address: "EQtest",
    status: "requested",
    txHash: null,
    installments: [
      { seq: 1, amountUsd: 2_475, status: "paid", dueAt: "2026-07-08T00:00:00Z", paidAt: "2026-07-08T00:00:00Z", txHash: "sim:1" },
      { seq: 2, amountUsd: 2_475, status: "pending", dueAt: "2026-07-15T00:00:00Z", paidAt: null, txHash: null },
      { seq: 3, amountUsd: 2_475, status: "pending", dueAt: "2026-07-22T00:00:00Z", paidAt: null, txHash: null },
      { seq: 4, amountUsd: 2_475, status: "pending", dueAt: "2026-07-29T00:00:00Z", paidAt: null, txHash: null },
    ],
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

describe("DistributionStatus — payout pipeline states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** The pipeline lives in a collapsed accordion — open it before asserting rows. */
  function openAccordion() {
    fireEvent.click(screen.getByTestId("dist-accordion-toggle"));
  }

  it("shows eligible, requested, scheduled and paid-out from distinct sources", () => {
    render(<DistributionStatus withdrawals={[withdrawal({})]} withdrawableUsd={3_000} />);
    expect(screen.getByTestId("dist-status")).toBeInTheDocument();
    expect(screen.queryByTestId("dist-eligible")).not.toBeInTheDocument();
    openAccordion();
    expect(screen.getByTestId("dist-eligible")).toHaveTextContent("$30.00");
    expect(screen.getByTestId("dist-requested")).toHaveTextContent("$100.00");
    expect(screen.getByTestId("dist-requested")).toHaveTextContent("1 open requests");
    expect(screen.getByTestId("dist-scheduled")).toHaveTextContent("$74.25");
    expect(screen.getByTestId("dist-paidout")).toHaveTextContent("$24.75");
  });

  it("requested never includes paid or rejected withdrawals", () => {
    render(
      <DistributionStatus
        withdrawals={[
          withdrawal({ id: "p", status: "paid", amountUsd: 7_000 }),
          withdrawal({ id: "r", status: "rejected", amountUsd: 9_000 }),
        ]}
        withdrawableUsd={3_000}
      />,
    );
    openAccordion();
    expect(screen.getByText("No payout requested")).toBeInTheDocument();
    expect(within(screen.getByTestId("dist-scheduled")).getByText("Not scheduled")).toBeInTheDocument();
  });

  it("unknown withdrawable stays Pending, never $0", () => {
    render(<DistributionStatus withdrawals={[]} withdrawableUsd={null} />);
    openAccordion();
    expect(screen.getByTestId("dist-eligible")).toHaveTextContent("Pending");
  });

  it("loading shows a skeleton, not zeros", () => {
    render(<DistributionStatus withdrawals={undefined} withdrawableUsd={undefined} />);
    expect(screen.getByTestId("dist-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("dist-status")).not.toBeInTheDocument();
  });

  it("renders the five-stage journey with an accrued head and next callout", () => {
    render(
      <DistributionStatus withdrawals={[withdrawal({})]} withdrawableUsd={3_000} accruedUsd={4_200} />,
    );
    openAccordion();
    expect(screen.getByTestId("dist-accrued")).toHaveTextContent("$42.00");
    // Callout answers the next event: the upcoming installment, not the total.
    expect(screen.getByTestId("dist-next")).toHaveTextContent("$24.75");
    expect(screen.getByTestId("dist-next")).toHaveTextContent("Next payout");
    // All five stages visible in lifecycle order.
    const section = screen.getByTestId("dist-status").textContent ?? "";
    expect(section.indexOf("Accrued")).toBeLessThan(section.indexOf("Eligible"));
    expect(section.indexOf("Eligible")).toBeLessThan(section.indexOf("Requested"));
    expect(section.indexOf("Requested")).toBeLessThan(section.indexOf("Scheduled"));
    expect(section.indexOf("Scheduled")).toBeLessThan(section.indexOf("Paid out"));
  });

  it("next callout is honest when nothing is scheduled", () => {
    render(<DistributionStatus withdrawals={[]} withdrawableUsd={3_000} />);
    openAccordion();
    expect(screen.getByTestId("dist-next")).toHaveTextContent("Not scheduled");
  });
});

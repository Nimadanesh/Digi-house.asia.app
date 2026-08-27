import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WithdrawalRequestsSection } from "@/components/settings/WithdrawalRequestsSection";
import type { Withdrawal } from "@/types/withdrawal";

const base: Withdrawal = {
  id: "wd-1",
  amountUsd: 12_500,
  feeUsd: 125,
  netUsd: 12_375,
  address: "EQ",
  status: "requested",
  txHash: null,
  installments: [
    { seq: 1, amountUsd: 3_094, status: "pending", dueAt: "2026-08-22T00:00:00.000Z", paidAt: null, txHash: null },
    { seq: 2, amountUsd: 3_094, status: "pending", dueAt: "2026-08-29T00:00:00.000Z", paidAt: null, txHash: null },
    { seq: 3, amountUsd: 3_094, status: "pending", dueAt: "2026-09-05T00:00:00.000Z", paidAt: null, txHash: null },
    { seq: 4, amountUsd: 3_093, status: "pending", dueAt: "2026-09-12T00:00:00.000Z", paidAt: null, txHash: null },
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
};

describe("WithdrawalRequestsSection — PE-08", () => {
  it("renders an amount and a status pill per request", () => {
    render(
      <WithdrawalRequestsSection
        withdrawals={[
          { ...base, id: "a", amountUsd: 12_500, status: "paid", txHash: "h".repeat(64) },
          { ...base, id: "b", amountUsd: 4_800, status: "requested" },
          { ...base, id: "c", amountUsd: 9_900, status: "approved" },
          { ...base, id: "d", amountUsd: 9_900, status: "rejected" },
        ]}
      />,
    );
    expect(screen.getByText("$125.00")).toBeInTheDocument();
    expect(screen.getByText("$48.00")).toBeInTheDocument();
    expect(screen.getAllByText("$99.00")).toHaveLength(2);
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("Requested")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  it("shows installment progress (paid of total) for each request", () => {
    render(
      <WithdrawalRequestsSection
        withdrawals={[
          {
            ...base,
            id: "a",
            status: "paid",
            txHash: "h".repeat(64),
            installments: base.installments.map((i) => ({
              ...i,
              status: "paid" as const,
              paidAt: "2026-08-20T00:00:00.000Z",
              txHash: "h".repeat(64),
            })),
          },
          {
            ...base,
            id: "b",
            amountUsd: 4_800,
            feeUsd: 48,
            netUsd: 4_752,
            installments: base.installments.map((i, idx) =>
              idx === 0 ? { ...i, status: "paid" as const, paidAt: "2026-08-20T00:00:00.000Z", txHash: "h".repeat(64) } : i,
            ),
          },
        ]}
      />,
    );
    expect(screen.getByText(/4 of 4 installments paid/)).toBeInTheDocument();
    expect(screen.getByText(/1 of 4 installments paid/)).toBeInTheDocument();
  });

  it("shows the empty state when there are no requests", () => {
    render(<WithdrawalRequestsSection withdrawals={[]} />);
    expect(screen.getByText("No withdrawal requests yet")).toBeInTheDocument();
  });

  it("shows skeletons while loading", () => {
    const { container } = render(
      <WithdrawalRequestsSection withdrawals={undefined} loading />,
    );
    expect(container.querySelectorAll("[aria-hidden]").length).toBeGreaterThan(0);
  });

  it("shows the error message instead of the list", () => {
    render(
      <WithdrawalRequestsSection
        withdrawals={undefined}
        error="Couldn't load withdrawal requests"
      />,
    );
    expect(screen.getByText("Couldn't load withdrawal requests")).toBeInTheDocument();
  });

  it("renders a Request withdrawal row that calls onRequest when provided", () => {
    const onRequest = vi.fn();
    render(<WithdrawalRequestsSection withdrawals={[]} onRequest={onRequest} />);
    const button = screen.getByTestId("withdrawal-request-open");
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it("hides the Request withdrawal row when onRequest is absent", () => {
    render(<WithdrawalRequestsSection withdrawals={[]} />);
    expect(screen.queryByTestId("withdrawal-request-open")).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WithdrawalRequestsSection } from "@/components/settings/WithdrawalRequestsSection";
import type { Withdrawal } from "@/types/withdrawal";

const base: Withdrawal = {
  id: "wd-1",
  amountUsd: 12_500,
  address: "EQ",
  status: "requested",
  txHash: null,
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

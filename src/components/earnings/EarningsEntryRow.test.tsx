import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EarningsEntryRow } from "@/components/earnings/EarningsEntryRow";
import type { EarningsEntry } from "@/types/earnings";
import { DEMO_TX_DISCLAIMER } from "@/lib/constants";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

vi.mock("@/hooks/useTelegram", () => ({
  useTelegram: () => ({ haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() } }),
}));

const paidEntry: EarningsEntry = {
  id: "e1",
  userId: "u1",
  propertyId: "p1",
  weekOf: "2026-07-20T00:00:00Z",
  amountUsd: 1500,
  tonAmount: 7_500_000,
  shareRatio: 0.075,
  status: "paid",
  txHash: "simulated:abc-def-12345",
};

const pendingEntry: EarningsEntry = {
  ...paidEntry,
  id: "e2",
  status: "pending",
  txHash: undefined,
};

describe("EarningsEntryRow — Fable payments + honesty", () => {
  it("paid collapsed: Paid pill WITHOUT simulated sibling on the row", () => {
    render(
      <EarningsEntryRow
        entry={paidEntry}
        propertyName="Bayside Marina Penthouse"
        weeklyRentPoolUsd={20000}
        sharesOwned={60}
      />,
    );
    expect(screen.getByText("Paid")).toHaveClass("text-success");
    expect(screen.queryByText("simulated")).not.toBeInTheDocument();
  });

  it("paid expanded: details + discrete demo disclaimer", () => {
    render(
      <EarningsEntryRow
        entry={paidEntry}
        propertyName="Bayside"
        weeklyRentPoolUsd={20000}
        sharesOwned={60}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Shares owned")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("Rental pool")).toBeInTheDocument();
    expect(screen.getByText("Calculation")).toBeInTheDocument();
    expect(screen.getByText("TON equivalent")).toBeInTheDocument();
    expect(screen.getByTestId("earnings-row-disclaimer")).toHaveTextContent(DEMO_TX_DISCLAIMER);
    expect(screen.getByText(/tx hash is a placeholder/i)).toBeInTheDocument();
  });

  it("pending: Pending pill; expanded has no demo tx disclaimer", () => {
    render(
      <EarningsEntryRow entry={pendingEntry} propertyName="Alfama Terrace" weeklyRentPoolUsd={25000} />,
    );
    expect(screen.getByText("Pending")).toHaveClass("text-warning");
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByTestId("earnings-row-disclaimer")).not.toBeInTheDocument();
  });

  it("amount uses tnum", () => {
    render(<EarningsEntryRow entry={paidEntry} propertyName="Bayside" weeklyRentPoolUsd={20000} />);
    expect(screen.getByText("$15.00")).toHaveClass("tnum");
  });
});

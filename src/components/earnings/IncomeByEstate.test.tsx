import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { IncomeByEstate } from "@/components/earnings/IncomeByEstate";
import type { EstateDisplayIdentity } from "@/lib/economics/estates/estate-display-identity";
import type { EarningsEntry } from "@/types/earnings";
import type { Holding } from "@/types/position";
import type { ShareLock } from "@/types/lock";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

const base: Omit<EarningsEntry, "id" | "weekOf" | "amountUsd" | "status"> = {
  userId: "u1",
  propertyId: "test-a",
  tonAmount: 0,
  shareRatio: 0.01,
};

function identity(id: string, name: string, location: string): [string, EstateDisplayIdentity] {
  return [id, { name, location, image: "/images/properties/p1.png" }];
}

describe("IncomeByEstate — per-estate paid totals linking to estate detail", () => {
  it("renders one row per estate with paid totals and a detail link", () => {
    const entries: EarningsEntry[] = [
      { ...base, id: "e1", weekOf: "2026-07-13T00:00:00Z", amountUsd: 1000, status: "paid" },
      { ...base, id: "e2", weekOf: "2026-07-06T00:00:00Z", amountUsd: 2000, status: "paid" },
    ];
    const byId = new Map([identity("test-a", "Syrene", "Sorrento, Amalfi Coast, Italy")]);
    render(<IncomeByEstate entries={entries} propertyById={byId} />);
    expect(screen.getByTestId("income-by-estate")).toBeInTheDocument();
    const row = screen.getByTestId("income-by-estate-row-test-a");
    expect(row).toHaveTextContent("Syrene");
    expect(row).toHaveTextContent("Sorrento, Amalfi Coast, Italy");
    expect(row).toHaveTextContent("$30.00"); // 1_000 + 2_000 minor units
    expect(row).toHaveTextContent("Received");
    expect(row).toHaveAttribute("href", "/property/test-a");
  });

  it("renders nothing when no estate has paid entries", () => {
    const entries: EarningsEntry[] = [
      { ...base, id: "e1", weekOf: "2026-07-20T00:00:00Z", amountUsd: 500, status: "pending" },
    ];
    const { container } = render(
      <IncomeByEstate entries={entries} propertyById={new Map()} />,
    );
    expect(screen.queryByTestId("income-by-estate")).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it("falls back to the raw property id when metadata is missing", () => {
    const entries: EarningsEntry[] = [
      { ...base, id: "e1", weekOf: "2026-07-13T00:00:00Z", amountUsd: 1000, status: "paid" },
    ];
    render(<IncomeByEstate entries={entries} propertyById={new Map()} />);
    const row = screen.getByTestId("income-by-estate-row-test-a");
    expect(row).toHaveTextContent("test-a");
  });
});

describe("IncomeByEstate — received-income composition", () => {
  const byId = () =>
    new Map([
      identity("test-a", "Syrene", "Sorrento, Amalfi Coast, Italy"),
      identity("test-b", "Palm Court", "Palm Jumeirah, UAE"),
    ]);
  const compEntries: EarningsEntry[] = [
    { ...base, id: "e1", propertyId: "test-a", weekOf: "2026-07-13T00:00:00Z", amountUsd: 3000, status: "paid" },
    { ...base, id: "e2", propertyId: "test-b", weekOf: "2026-07-13T00:00:00Z", amountUsd: 2000, status: "paid" },
    { ...base, id: "e3", propertyId: "test-b", weekOf: "2026-07-20T00:00:00Z", amountUsd: 9999, status: "pending" },
  ];

  it("shows total received plus a paid-only segmented composition", () => {
    render(<IncomeByEstate entries={compEntries} propertyById={byId()} />);
    expect(screen.getByTestId("estate-comp-total")).toHaveTextContent("$50.00");
    const segments = screen.getAllByTestId("estate-comp-segment");
    expect(segments).toHaveLength(2);
    // Pending $99.99 never enters the received composition.
    expect(screen.getByTestId("estate-comp")).not.toHaveTextContent("$99.99");
  });

  it("names the top contributor from deterministic shares", () => {
    render(<IncomeByEstate entries={compEntries} propertyById={byId()} />);
    expect(screen.getByTestId("estate-comp-insight")).toHaveTextContent(
      "Syrene generated 60% of your received income.",
    );
  });

  it("ranks rows with proportional bars and no insight for a single estate", () => {
    render(
      <IncomeByEstate
        entries={compEntries.filter((e) => e.propertyId === "test-a")}
        propertyById={byId()}
      />,
    );
    expect(screen.queryByTestId("estate-comp-insight")).not.toBeInTheDocument();
    expect(screen.getByTestId("estate-rank-test-a")).toHaveStyle({ width: "100%" });
  });
});

const testHolding: Holding = {
  propertyId: "test-a",
  sharesOwned: 160,
  avgCostUsd: 12_000,
  currentValueUsd: 1_920_000,
  pendingWeekEarningsUsd: 0,
  shareRatio: 0.16,
};

const testLock: ShareLock = {
  id: "lock-1",
  propertyId: "test-a",
  shares: 100,
  principalUsd: 1_200_000,
  payoutPeriod: "monthly",
  monthlyRate: 6,
  status: "locked",
  lockedAt: "2026-07-01T00:00:00Z",
  unlockRequestedAt: null,
  maturedAt: null,
  nextPayoutAt: "2026-08-01T00:00:00Z",
  maturesAt: null,
  accruedUnpaidUsd: 4_200,
  installmentUsd: 5_000,
  projectedMonthlyUsd: 5_000,
  projectedWeeklyUsd: 1_200,
};

describe("IncomeByEstate — position rows (ownership, projected, accrued)", () => {
  const byId = () => new Map([identity("test-a", "Syrene", "Sorrento, Amalfi Coast, Italy")]);

  it("extends rows with ownership, projected and accrued from position data", () => {
    const entries: EarningsEntry[] = [
      { ...base, id: "e1", weekOf: "2026-07-13T00:00:00Z", amountUsd: 1500, status: "paid" },
      { ...base, id: "e2", weekOf: "2026-07-20T00:00:00Z", amountUsd: 500, status: "pending" },
    ];
    render(
      <IncomeByEstate entries={entries} propertyById={byId()} holdings={[testHolding]} locks={[testLock]} />,
    );
    const row = screen.getByTestId("income-by-estate-row-test-a");
    expect(row).toHaveTextContent("160 shares");
    expect(row).toHaveTextContent("16%");
    expect(row).toHaveTextContent("$15.00"); // paid
    expect(row).toHaveTextContent("$5.00"); // projected (pending ledger)
    expect(row).toHaveTextContent("$42.00"); // accrued (lock engine)
    expect(row).toHaveAttribute("href", "/property/test-a");
  });

  it("holdings without history show Pending paid, never $0", () => {
    render(
      <IncomeByEstate entries={[]} propertyById={byId()} holdings={[testHolding]} locks={[]} />,
    );
    const row = screen.getByTestId("income-by-estate-row-test-a");
    expect(row).toHaveTextContent("Pending");
    expect(row).not.toHaveTextContent("$0.00");
  });
});

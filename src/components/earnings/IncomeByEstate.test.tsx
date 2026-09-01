import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { IncomeByEstate } from "@/components/earnings/IncomeByEstate";
import type { EarningsEntry } from "@/types/earnings";
import type { Listing } from "@/types/property";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

const base: Omit<EarningsEntry, "id" | "weekOf" | "amountUsd" | "status"> = {
  userId: "u1",
  propertyId: "prop-a",
  tonAmount: 0,
  shareRatio: 0.01,
};

function listing(id: string, title: string, location: string): Listing {
  return {
    id,
    title,
    location,
    description: "",
    images: ["/images/properties/p1.png"],
    totalShares: 1000,
    sharePriceUsd: 10_000,
    status: "funded",
    ownerWalletAddress: "EQ-test",
    annualRentUsd: 1_000_000,
    createdAt: "2026-01-01T00:00:00Z",
    meta: {
      sizeSqm: 70,
      yearBuilt: 2019,
      propertyType: "Apartment",
      rentalStatus: "rented",
      leaseUntil: null,
      activeTenant: true,
      tokenizationDocUrl: "#demo",
    },
    rentalHistory: [],
    totalValueUsd: 100_000_000,
    sharesSold: 1000,
    sharesRemaining: 0,
    fundingProgressRatio: 1,
    monthlyYieldRate: 5,
  };
}

describe("IncomeByEstate — per-estate paid totals linking to estate detail", () => {
  it("renders one row per estate with paid totals and a detail link", () => {
    const entries: EarningsEntry[] = [
      { ...base, id: "e1", weekOf: "2026-07-13T00:00:00Z", amountUsd: 1000, status: "paid" },
      { ...base, id: "e2", weekOf: "2026-07-06T00:00:00Z", amountUsd: 2000, status: "paid" },
    ];
    const byId = new Map([["prop-a", listing("prop-a", "Marina Vista", "Dubai Marina, UAE")]]);
    render(<IncomeByEstate entries={entries} propertyById={byId} />);
    expect(screen.getByTestId("income-by-estate")).toBeInTheDocument();
    const row = screen.getByTestId("income-by-estate-row-prop-a");
    expect(row).toHaveTextContent("Marina Vista");
    expect(row).toHaveTextContent("Dubai Marina, UAE");
    expect(row).toHaveTextContent("$30.00"); // 1_000 + 2_000 minor units
    expect(row).toHaveTextContent("Received");
    expect(row).toHaveAttribute("href", "/property/prop-a");
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
    const row = screen.getByTestId("income-by-estate-row-prop-a");
    expect(row).toHaveTextContent("prop-a");
  });
});

// Final PO Decision 4: new locks are monthly-only. The weekly economic option
// must not be offered, previewed, or submitted for new creation.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Listing } from "@/types/property";
import { LockSheet } from "@/components/property/LockSheet";

const createMutate = vi.fn();

vi.mock("@/lib/telegram/haptics", () => ({
  haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
}));

vi.mock("@/hooks/useLocks", () => ({
  useCreateLock: vi.fn(() => ({
    mutate: createMutate,
    isPending: false,
    isError: false,
    error: null,
  })),
}));

const listing: Listing = {
  id: "prop-x",
  title: "Villa One",
  location: "Y",
  description: "x",
  images: [],
  totalShares: 80000,
  sharePriceUsd: 10_000,
  status: "funding",
  ownerWalletAddress: "EQAtest",
  annualRentUsd: 500_000,
  createdAt: "2026-01-12T09:00:00Z",
  sharesSold: 0,
  sharesRemaining: 80000,
  fundingProgressRatio: 0,
  monthlyYieldRate: 6,
  totalValueUsd: 8_000_000_00,
  meta: {
    sizeSqm: 72,
    yearBuilt: 2019,
    propertyType: "Villa",
    rentalStatus: "rented",
    leaseUntil: null,
    activeTenant: true,
    tokenizationDocUrl: "#",
  },
  rentalHistory: [],
};

function renderSheet() {
  render(
    <LockSheet open onClose={() => {}} listing={listing} freeShares={10} avgCostUsd={10_000} />,
  );
}

describe("LockSheet — monthly-only new locks (Final PO Decision 4)", () => {
  it("offers no weekly economic option", () => {
    renderSheet();
    expect(screen.queryByText("Weekly")).not.toBeInTheDocument();
    expect(screen.queryByText("Weekly payout")).not.toBeInTheDocument();
    expect(screen.getByText("Monthly payout")).toBeInTheDocument();
  });

  it("submits new locks with payoutPeriod monthly", () => {
    renderSheet();
    fireEvent.click(screen.getByTestId("lock-confirm"));
    expect(createMutate).toHaveBeenCalledWith(
      { propertyId: "prop-x", shares: 1, payoutPeriod: "monthly" },
      expect.anything(),
    );
  });
});

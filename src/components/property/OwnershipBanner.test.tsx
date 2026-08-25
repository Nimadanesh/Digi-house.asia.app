import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Listing } from "@/types/property";
import { OwnershipBanner } from "@/components/property/OwnershipBanner";

vi.mock("@/hooks/useLocks", () => ({
  useCreateLock: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false, error: null })),
}));

const listing: Listing = {
  id: "prop-x",
  title: "X",
  location: "Y",
  description: "x",
  images: [],
  totalShares: 1000,
  sharePriceUsd: 12_000,
  status: "funding",
  ownerWalletAddress: "EQAtest",
  annualRentUsd: 500_000,
  createdAt: "2026-01-12T09:00:00Z",
  sharesSold: 100,
  sharesRemaining: 900,
  fundingProgressRatio: 0.1,
  monthlyYieldRate: 6,
  totalValueUsd: 8_000_000,
  meta: {
    sizeSqm: 72,
    yearBuilt: 2019,
    propertyType: "Apartment",
    rentalStatus: "rented",
    leaseUntil: null,
    activeTenant: true,
    tokenizationDocUrl: "#",
  },
  rentalHistory: [],
};

function renderBanner(ownedShares: number, lockedShares: number) {
  return render(
    <OwnershipBanner listing={listing} ownedShares={ownedShares} lockedShares={lockedShares} />,
  );
}

describe("OwnershipBanner — redesign Phase 6", () => {
  it("renders nothing when the user owns no shares", () => {
    const { container } = renderBanner(0, 0);
    expect(container).toBeEmptyDOMElement();
  });

  it("unlocked owner: counts + lock CTA opening the confirmation sheet", () => {
    renderBanner(160, 100);
    expect(screen.getByTestId("ownership-copy")).toHaveTextContent(/You own 160 shares · 100 locked/);
    expect(screen.getByTestId("ownership-state")).toHaveTextContent("Not earning yet");
    fireEvent.click(screen.getByTestId("banner-lock"));
    expect(screen.getByTestId("lock-sheet")).toBeInTheDocument();
    // Sheet is capped at the free (unlocked) share count
    expect(screen.getByText("Free shares")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByTestId("lock-confirm")).toHaveTextContent(/Lock 1 share & earn/);
  });

  it("fully locked owner: Earning state, no lock CTA", () => {
    renderBanner(100, 100);
    expect(screen.getByTestId("ownership-state")).toHaveTextContent("Earning");
    expect(screen.queryByTestId("banner-lock")).not.toBeInTheDocument();
  });
});

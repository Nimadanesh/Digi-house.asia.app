import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HoldingDetailSheet } from "@/components/portfolio/HoldingDetailSheet";
import type { Holding } from "@/types/position";
import type { HoldingNft } from "@/types/nft";

const holding: Holding = {
  propertyId: "prop-a",
  sharesOwned: 100,
  avgCostUsd: 12_500,
  currentValueUsd: 1_250_000,
  pendingWeekEarningsUsd: 1000,
  shareRatio: 0.01,
};

const baseNft: HoldingNft = {
  id: "nft_1",
  propertyId: "prop-a",
  propertyTitle: "Villa A",
  propertyLocation: "Bali",
  sharesOwned: 100,
  status: "pending",
  walletAddress: "EQ",
  collectionAddress: null,
  nftItemId: null,
  nftAddress: null,
  metadataUrl: null,
  mintTxHash: null,
  transferTxHash: null,
  attempts: 0,
  errorCode: null,
  errorMessage: null,
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z",
};

describe("HoldingDetailSheet — collectible NFT block (Phase 9)", () => {
  it("shows status when a pending NFT exists", () => {
    render(
      <HoldingDetailSheet
        open
        onClose={() => {}}
        holding={holding}
        title="Villa A"
        location="Bali"
        nft={baseNft}
      />,
    );
    expect(screen.getByTestId("holding-nft-block")).toBeInTheDocument();
    expect(screen.getByText("Collectible NFT")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("shows item id + explorer link when delivered with an address", () => {
    render(
      <HoldingDetailSheet
        open
        onClose={() => {}}
        holding={holding}
        title="Villa A"
        location="Bali"
        nft={{
          ...baseNft,
          status: "delivered",
          nftItemId: 42,
          nftAddress: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB",
        }}
      />,
    );
    expect(screen.getByText("#42")).toBeInTheDocument();
    const link = screen.getByTestId("holding-nft-explorer");
    expect(link).toHaveAttribute(
      "href",
      "https://testnet.tonviewer.com/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB",
    );
  });

  it("shows the collectible disclaimer", () => {
    render(
      <HoldingDetailSheet
        open
        onClose={() => {}}
        holding={holding}
        title="Villa A"
        location="Bali"
        nft={baseNft}
      />,
    );
    expect(
      screen.getByText(/collectible receipt — the database remains the record of ownership/i),
    ).toBeInTheDocument();
  });

  it("hides the block when no NFT exists", () => {
    render(
      <HoldingDetailSheet
        open
        onClose={() => {}}
        holding={holding}
        title="Villa A"
        location="Bali"
      />,
    );
    expect(screen.queryByTestId("holding-nft-block")).not.toBeInTheDocument();
  });
});

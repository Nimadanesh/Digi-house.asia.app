import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Listing } from "@/types/property";
import { PropertyDetail } from "@/components/property/PropertyDetail";
import { DEMO_TX_DISCLAIMER } from "@/lib/constants";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

vi.mock("@/hooks/useTelegram", () => ({
  useTelegram: () => ({
    haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
  }),
}));

const listing: Listing = {
  id: "prop-marina-vista-4b",
  title: "Marina Vista Apt 4B",
  location: "Dubai Marina, UAE",
  description: "Waterfront one-bedroom with marina view and 24h concierge.",
  images: ["/images/properties/p1.png", "/images/properties/p2.png"],
  totalShares: 1000,
  sharePriceUsd: 12500,
  status: "funding",
  ownerWalletAddress: "EQAtest",
  annualRentUsd: 520000,
  createdAt: "2026-01-12T09:00:00Z",
  sharesSold: 920,
  sharesRemaining: 80,
  fundingProgressRatio: 0.92,
  meta: {
    sizeSqm: 72,
    yearBuilt: 2019,
    propertyType: "Apartment",
    rentalStatus: "rented",
    leaseUntil: "2026-12-31",
    activeTenant: true,
    tokenizationDocUrl: "#tokenization-demo",
  },
  rentalHistory: [
    { id: "r1", paidAt: "2026-07-04", status: "paid" },
    { id: "r2", paidAt: "2026-06-06", status: "paid" },
    { id: "r3", paidAt: "2026-05-02", status: "paid" },
  ],
};

describe("PropertyDetail — Fable sections", () => {
  it("renders gallery, hero title, APY badge, scarcity text", () => {
    render(
      <PropertyDetail listing={listing} previewShares={10} onPreviewSharesChange={() => {}} />,
    );
    expect(screen.getByTestId("property-gallery")).toBeInTheDocument();
    expect(screen.getByText("Marina Vista Apt 4B")).toBeInTheDocument();
    expect(screen.getByTestId("apy-badge")).toBeInTheDocument();
    expect(screen.getByText(/Only/)).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
  });

  it("renders 2×2 metrics grid labels", () => {
    render(
      <PropertyDetail listing={listing} previewShares={10} onPreviewSharesChange={() => {}} />,
    );
    expect(screen.getByText("Price per share")).toBeInTheDocument();
    expect(screen.getByText("Weekly yield / share")).toBeInTheDocument();
    expect(screen.getByText("Annual yield")).toBeInTheDocument();
    expect(screen.getByText("Total property value")).toBeInTheDocument();
  });

  it("income calculator updates projection when shares change", () => {
    const onChange = vi.fn();
    render(
      <PropertyDetail listing={listing} previewShares={10} onPreviewSharesChange={onChange} />,
    );
    expect(screen.getByTestId("income-projection")).toHaveTextContent(/With 10 shares/);
    fireEvent.click(screen.getByLabelText("Increase shares"));
    expect(onChange).toHaveBeenCalled();
  });

  it("about expands details without repeating demo disclaimer", () => {
    render(
      <PropertyDetail listing={listing} previewShares={10} onPreviewSharesChange={() => {}} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /more details/i }));
    expect(screen.getByTestId("about-details")).toBeInTheDocument();
    expect(screen.getByText("72 m²")).toBeInTheDocument();
    expect(screen.getByText("Apartment")).toBeInTheDocument();
  });

  it("trust checks and rental history with one demo disclaimer", () => {
    render(
      <PropertyDetail listing={listing} previewShares={10} onPreviewSharesChange={() => {}} />,
    );
    expect(screen.getByText("Active tenant ✓")).toBeInTheDocument();
    expect(screen.getByText("Tokenization Document")).toBeInTheDocument();
    expect(screen.getByTestId("rental-history")).toBeInTheDocument();
    expect(screen.getAllByText("Paid ✓").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText(DEMO_TX_DISCLAIMER).length).toBe(1);
    expect(screen.queryByText("simulated", { exact: true })).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PortfolioSummary } from "@/types/position";
import type { Listing } from "@/types/property";
import type { EarningsSummary } from "@/types/earnings";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

vi.mock("@/hooks/useTelegramUser", () => ({
  useTelegramUser: () => ({ firstName: "Demo", photoUrl: undefined, isDemo: true }),
}));
vi.mock("@/hooks/useTonConnect", () => ({
  useTonConnect: () => ({
    connected: true,
    openModal: vi.fn(),
    address: "EQ",
    short: "EQ…",
    restoring: false,
    network: "testnet",
    disconnect: vi.fn(),
    send: vi.fn(),
  }),
}));
vi.mock("@/hooks/useTelegram", () => ({
  useTelegram: () => ({ haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() } }),
}));
vi.mock("@/hooks/usePayoutCountdownDhms", () => ({
  usePayoutCountdownDhms: () => "2d - 14h - 00m - 00s",
}));

const usePortfolio = vi.fn();
const useEarnings = vi.fn();
const useMarketplace = vi.fn();
vi.mock("@/hooks/usePortfolio", () => ({ usePortfolio: () => usePortfolio() }));
vi.mock("@/hooks/useEarnings", () => ({ useEarnings: () => useEarnings() }));
vi.mock("@/hooks/useMarketplace", () => ({ useMarketplace: () => useMarketplace() }));

import HomePage from "@/app/(app)/home/page";

const listing: Listing = {
  id: "prop-marina-vista-4b",
  title: "Marina Vista Apt 4B",
  location: "Dubai Marina, UAE",
  description: "Waterfront",
  images: ["/images/properties/p1.png"],
  totalShares: 1000,
  sharePriceUsd: 12500,
  status: "funding",
  ownerWalletAddress: "EQA",
  annualRentUsd: 520000,
  createdAt: "2026-07-10T00:00:00Z",
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
    tokenizationDocUrl: "#",
  },
  rentalHistory: [],
};

const summary: PortfolioSummary = {
  totalValueUsd: 250_000,
  totalInvestedUsd: 240_000,
  totalEarningsUsd: 12_000,
  weeklyProjectedUsd: 3_375,
  dayChangeRatio: 0.023,
  holdings: [
    {
      propertyId: listing.id,
      sharesOwned: 20,
      avgCostUsd: 12500,
      currentValueUsd: 250_000,
      pendingWeekEarningsUsd: 200,
      shareRatio: 0.02,
    },
  ],
  openOrders: [],
};

const earnings: EarningsSummary = {
  allTimeUsd: 12_000,
  thisWeekProjectedUsd: 3_375,
  projectedNextWeekUsd: 3_375,
  entries: [],
};

describe("Home page — Fable redesign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMarketplace.mockReturnValue({ data: [listing], isLoading: false, isError: false });
    useEarnings.mockReturnValue({ data: earnings, isLoading: false, isError: false });
  });

  it("loading: home skeleton", () => {
    usePortfolio.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() });
    render(<HomePage />);
    expect(screen.getByTestId("home-skeleton")).toBeInTheDocument();
  });

  it("error: Retry", () => {
    usePortfolio.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() });
    render(<HomePage />);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("loaded: portfolio card, next payout, my properties, featured", () => {
    usePortfolio.mockReturnValue({ data: summary, isLoading: false, isError: false, refetch: vi.fn() });
    render(<HomePage />);
    expect(screen.getByTestId("portfolio-value-card")).toHaveAttribute("href", "/portfolio");
    expect(screen.getByTestId("day-change-badge")).toHaveTextContent("+2.3%");
    expect(screen.getByText("Total Invested")).toBeInTheDocument();
    expect(screen.getByText("Total Earnings Received")).toBeInTheDocument();
    expect(screen.getByTestId("next-payout-card")).toHaveAttribute("href", "/earnings");
    expect(screen.getByTestId("next-payout-timer")).toHaveTextContent("2d - 14h - 00m - 00s");
    expect(screen.getByTestId("next-payout-amount")).toHaveTextContent("$33.75");
    expect(screen.getByTestId("my-properties-scroll")).toBeInTheDocument();
    expect(screen.getByTestId("home-property-chip")).toHaveAttribute(
      "href",
      `/property/${listing.id}`,
    );
    expect(screen.getByTestId("featured-card")).toBeInTheDocument();
  });


  it("empty holdings: Buy your first share + Browse Marketplace", () => {
    usePortfolio.mockReturnValue({
      data: { ...summary, holdings: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(<HomePage />);
    expect(screen.getByTestId("first-share-empty")).toBeInTheDocument();
    expect(screen.getByText("Buy your first share")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse marketplace/i })).toHaveAttribute("href", "/marketplace");
    // Featured still available
    expect(screen.getByTestId("featured-card")).toBeInTheDocument();
  });

  it("loaded page has wallet-free content (global header is shell-owned)", () => {
    usePortfolio.mockReturnValue({ data: summary, isLoading: false, isError: false, refetch: vi.fn() });
    render(<HomePage />);
    expect(screen.getByTestId("home-page")).toBeInTheDocument();
    expect(screen.queryByTestId("home-header")).not.toBeInTheDocument();
  });
});

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
vi.mock("@/hooks/useSharedNowMs", () => ({ useSharedNowMs: () => 1_700_000_000_000 }));

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
  monthlyYieldRate: 6.25,
  totalValueUsd: 8_000_000,
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

const fundingTwo: Listing = {
  ...listing,
  id: "prop-second-primary",
  title: "Second Primary",
  location: "Bali",
  description: "Oceanfront",
  images: ["/images/properties/p1.png"],
  status: "funding",
  totalValueUsd: 5_000_000,
};

const fundedResale: Listing = {
  ...listing,
  id: "prop-resale",
  title: "Resale Villa",
  location: "Mykonos",
  description: "Villa",
  images: ["/images/properties/p1.png"],
  status: "funded",
  totalValueUsd: 6_000_000,
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
  entries: [
    {
      id: "e1",
      userId: "u1",
      propertyId: listing.id,
      weekOf: "2026-07-20T00:00:00Z",
      amountUsd: 3375,
      tonAmount: 0,
      shareRatio: 0.02,
      status: "pending",
    },
  ],
};

describe("Home page — ownership-first redesign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMarketplace.mockReturnValue({
      data: [listing, fundingTwo, fundedResale],
      isLoading: false,
      isError: false,
    });
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

  it("loaded: Your Estates hero, Next Distribution (Expected), My Estates preview, Featured Estate, More Estates, trust footer", () => {
    usePortfolio.mockReturnValue({ data: summary, isLoading: false, isError: false, refetch: vi.fn() });
    render(<HomePage />);

    // Your Estates hero: value + calm estates/invested/rental-income line, no day-change badge.
    expect(screen.getByTestId("your-estates-card")).toHaveAttribute("href", "/portfolio");
    expect(screen.getByTestId("your-estates-amount")).toHaveTextContent("$2,500.00");
    expect(screen.getByTestId("your-estates-cta")).toHaveTextContent("View My Estates");
    const heroSecondary = screen.getByTestId("your-estates-secondary");
    expect(heroSecondary).toHaveTextContent("estates");
    expect(heroSecondary).toHaveTextContent("$2,400.00 Total Invested");
    expect(heroSecondary).toHaveTextContent("+$120.00 rental income YTD");
    expect(screen.queryByTestId("day-change-badge")).not.toBeInTheDocument();

    // Next Distribution — scheduled from a real schedule → Expected, static date, no countdown.
    expect(screen.getByTestId("next-payout-summary")).toHaveAttribute("href", "/earnings");
    expect(screen.getByText("Next Distribution")).toBeInTheDocument();
    expect(screen.getByTestId("next-distribution-status")).toHaveTextContent("Expected");
    expect(screen.getByTestId("next-payout-date")).toHaveTextContent(/Sun/);
    expect(screen.getByTestId("next-payout-amount")).toHaveTextContent("$33.75");
    expect(screen.queryByTestId("next-payout-timer")).not.toBeInTheDocument();

    // My Estates preview — ownership % + current value on the chip.
    expect(screen.getByTestId("my-properties-list")).toBeInTheDocument();
    expect(screen.getByText("My Estates (1)")).toBeInTheDocument();
    expect(screen.getByText("All my estates")).toBeInTheDocument();
    expect(screen.getByText("2.0% of the estate · 20 shares")).toBeInTheDocument();

    // Editorial Featured Estate — no APY badge, honest owner-stay Data pending, View Estate CTA.
    expect(screen.getByTestId("featured-card")).toBeInTheDocument();
    expect(screen.getByText("Featured Estate")).toBeInTheDocument();
    expect(screen.queryByText("APY")).not.toBeInTheDocument();
    expect(screen.getByText("Data pending")).toBeInTheDocument();
    expect(screen.getByTestId("featured-cta")).toHaveTextContent("View Estate");

    // 1–3 primary listings in More Estates (excludes featured + non-primary).
    const moreCards = screen.getAllByTestId("more-opportunity-card");
    expect(moreCards.length).toBeGreaterThan(0);
    expect(moreCards.length).toBeLessThanOrEqual(3);

    expect(screen.getByTestId("home-trust-footer")).toBeInTheDocument();
  });

  it("caps My Estates to a short calm set (max 3 + All my estates)", () => {
    const fiveProperties = [
      ...Array.from({ length: 5 }).map((_, i) => ({
        ...listing,
        id: `prop-clone-${i}`,
        title: `Clone Villa ${i}`,
      })),
    ];
    const manyHoldings = fiveProperties.map((p) => ({
      propertyId: p.id,
      sharesOwned: 10,
      avgCostUsd: 12500,
      currentValueUsd: 50_000,
      pendingWeekEarningsUsd: 200,
      shareRatio: 0.001,
    }));
    useMarketplace.mockReturnValue({ data: fiveProperties, isLoading: false, isError: false });
    usePortfolio.mockReturnValue({
      data: { ...summary, holdings: manyHoldings },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(<HomePage />);
    expect(screen.getAllByTestId("home-property-chip").length).toBe(3);
    expect(screen.getByText("+2 more in My Estates")).toBeInTheDocument();
  });

  it("no ownership: estates empty state replaces the hero; Featured Estate still visible", () => {
    usePortfolio.mockReturnValue({
      data: { ...summary, holdings: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(<HomePage />);
    // Ownership empty state in place of the hero, with an Explore Estates CTA.
    expect(screen.getByTestId("home-empty-state")).toBeInTheDocument();
    expect(screen.getByText("You don't own any estates yet")).toBeInTheDocument();
    expect(screen.getByTestId("empty-browse-marketplace")).toHaveAttribute("href", "/marketplace");
    // No $0 hero, no distribution card (nothing owned, nothing scheduled), no properties preview.
    expect(screen.queryByTestId("your-estates-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("next-payout-summary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("my-properties-section")).not.toBeInTheDocument();
    // Discovery remains.
    expect(screen.getByTestId("featured-card")).toBeInTheDocument();
  });

  it("loaded page has wallet-free content (global header is shell-owned)", () => {
    usePortfolio.mockReturnValue({ data: summary, isLoading: false, isError: false, refetch: vi.fn() });
    render(<HomePage />);
    expect(screen.getByTestId("home-page")).toBeInTheDocument();
    expect(screen.queryByTestId("home-header")).not.toBeInTheDocument();
  });
});
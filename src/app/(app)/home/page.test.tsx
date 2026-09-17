import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PortfolioSummary } from "@/types/position";
import type { Listing } from "@/types/property";

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
const useMarketplace = vi.fn();
vi.mock("@/hooks/usePortfolio", () => ({ usePortfolio: () => usePortfolio() }));
vi.mock("@/hooks/useMarketplace", () => ({ useMarketplace: () => useMarketplace() }));

import HomePage from "@/app/(app)/home/page";

const listing: Listing = {
  id: "re-128862",
  title: "Grand 2 BDM Ocean Pool Villa (JOALI Being)",
  location: "Bodufushi, JOALI Being, Raa Atoll, Maldives",
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

describe("Home page — prod strip (no next payout)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMarketplace.mockReturnValue({
      data: [listing],
      isLoading: false,
      isError: false,
    });
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

  it("loaded with ownership: hero + actions + Activity (no payout row) + For you", () => {
    usePortfolio.mockReturnValue({ data: summary, isLoading: false, isError: false, refetch: vi.fn() });
    render(<HomePage />);

    expect(screen.getByTestId("home-page")).toBeInTheDocument();
    expect(screen.getByTestId("home-hero")).toBeInTheDocument();
    expect(screen.getByTestId("home-actions")).toBeInTheDocument();

    // Details action is replaced by the Card action → /card route.
    expect(screen.getByTestId("action-card")).toHaveAttribute("href", "/card");
    expect(screen.queryByTestId("action-details")).not.toBeInTheDocument();

    // Activity capsule stays, payout row is gone.
    expect(screen.getByTestId("home-activity")).toBeInTheDocument();
    expect(screen.getByTestId("activity-see-all")).toBeInTheDocument();
    expect(screen.queryByTestId("payout-row")).not.toBeInTheDocument();
    expect(screen.queryByTestId("payout-row-toggle")).not.toBeInTheDocument();
    expect(screen.queryByTestId("payout-row-amount")).not.toBeInTheDocument();

    // No next-payout surfaces anywhere on Home.
    expect(screen.queryByTestId("next-payout-summary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("next-payout-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("next-payout-amount")).not.toBeInTheDocument();
    expect(screen.queryByTestId("next-payout-date")).not.toBeInTheDocument();
    expect(screen.queryByTestId("next-payout-timer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("details-next")).not.toBeInTheDocument();
    expect(screen.queryByText(/next payout/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/next distribution/i)).not.toBeInTheDocument();

    // For you stays.
    expect(screen.getByTestId("home-foryou")).toBeInTheDocument();
    expect(screen.getByTestId("foryou-card")).toBeInTheDocument();
  });

  it("no ownership: empty state, Activity without payout, For you invite", () => {
    usePortfolio.mockReturnValue({
      data: { ...summary, holdings: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(<HomePage />);
    expect(screen.getByTestId("home-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("empty-browse-marketplace")).toHaveAttribute("href", "/marketplace");
    // No payout row when nothing is owned.
    expect(screen.queryByTestId("payout-row")).not.toBeInTheDocument();
    expect(screen.queryByTestId("next-payout-summary")).not.toBeInTheDocument();
    expect(screen.queryByText(/next payout/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/next distribution/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("home-foryou")).toBeInTheDocument();
  });

  it("loaded page has wallet-free content (global header is shell-owned)", () => {
    usePortfolio.mockReturnValue({ data: summary, isLoading: false, isError: false, refetch: vi.fn() });
    render(<HomePage />);
    expect(screen.getByTestId("home-page")).toBeInTheDocument();
    expect(screen.queryByTestId("home-header")).not.toBeInTheDocument();
  });
});

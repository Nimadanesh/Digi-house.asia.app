import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

vi.mock("@/hooks/useEarnings", () => ({ useEarnings: vi.fn() }));
vi.mock("@/hooks/useMarketplace", () => ({
  useMarketplace: vi.fn(() => ({
    data: [
      {
        id: "prop-bayside-marina-penthouse",
        title: "Bayside Marina Penthouse",
        images: ["/images/properties/p1.png"],
        annualRentUsd: 1_040_000,
      },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })),
}));
vi.mock("@/hooks/usePortfolio", () => ({
  usePortfolio: vi.fn(() => ({
    data: {
      holdings: [{ propertyId: "prop-bayside-marina-penthouse", sharesOwned: 60 }],
    },
    isLoading: false,
    isError: false,
  })),
}));
vi.mock("@/hooks/useTelegram", () => ({
  useTelegram: () => ({
    haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
  }),
}));
vi.mock("@/hooks/usePayoutCountdownLong", () => ({
  usePayoutCountdownLong: () => "2 days 14 hours",
}));
vi.mock("@/hooks/usePayoutCountdown", () => ({
  usePayoutCountdown: () => "in 2d 14h",
}));

import { useEarnings } from "@/hooks/useEarnings";
import EarningsPage from "@/app/(app)/earnings/page";
import type { EarningsSummary } from "@/types/earnings";
import { DEMO_TX_DISCLAIMER } from "@/lib/constants";

const loadedSummary: EarningsSummary = {
  allTimeUsd: 12_000,
  thisWeekProjectedUsd: 3_375,
  projectedNextWeekUsd: 3_375,
  entries: [
    {
      id: "e1",
      userId: "u1",
      propertyId: "prop-bayside-marina-penthouse",
      weekOf: "2026-07-13T00:00:00Z",
      amountUsd: 1_500,
      tonAmount: 7_500_000_000,
      shareRatio: 0.075,
      status: "paid",
      txHash: "simulated:abc",
    },
    {
      id: "e2",
      userId: "u1",
      propertyId: "prop-bayside-marina-penthouse",
      weekOf: "2026-07-20T00:00:00Z",
      amountUsd: 1_500,
      tonAmount: 7_500_000_000,
      shareRatio: 0.075,
      status: "pending",
    },
  ],
};

describe("Earnings page Fable polish and states", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loading skeleton", () => {
    vi.mocked(useEarnings).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<EarningsPage />);
    expect(screen.getByTestId("earnings-skeleton")).toBeInTheDocument();
  });

  it("error Retry", () => {
    vi.mocked(useEarnings).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as never);
    render(<EarningsPage />);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("empty motivational copy and Browse Marketplace", () => {
    vi.mocked(useEarnings).mockReturnValue({
      data: { ...loadedSummary, entries: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<EarningsPage />);
    expect(screen.getByText(/haven.t earned yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse marketplace/i })).toHaveAttribute(
      "href",
      "/marketplace",
    );
  });

  it("loaded hero chart payments without page-level PAYOUT_DISCLAIMER", () => {
    vi.mocked(useEarnings).mockReturnValue({
      data: loadedSummary,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<EarningsPage />);
    expect(screen.getByTestId("earnings-hero")).toBeInTheDocument();
    expect(screen.getByTestId("earnings-hero-amount")).toHaveTextContent("$33.75");
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    expect(screen.getByTestId("earnings-chart")).toBeInTheDocument();
    expect(screen.getByText(/Last 8 weeks/i)).toBeInTheDocument();
    expect(screen.getAllByTestId("chart-bar").length).toBe(8);
    expect(screen.getByTestId("payments-summary")).toHaveTextContent(/Payments Received/);
    expect(screen.getByTestId("earnings-payments")).toBeInTheDocument();
    expect(
      screen.queryByText("simulated weekly payout � on-chain verifiable post-MVP"),
    ).not.toBeInTheDocument();
  });

  it("row expand shows shares and demo disclaimer; collapsed has no simulated label", () => {
    vi.mocked(useEarnings).mockReturnValue({
      data: loadedSummary,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<EarningsPage />);
    expect(screen.queryByText("simulated")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("earnings-row-e1"));
    expect(screen.getByTestId("earnings-disclosure")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByTestId("earnings-row-disclaimer")).toHaveTextContent(DEMO_TX_DISCLAIMER);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

vi.mock("@/hooks/useEarnings", () => ({ useEarnings: vi.fn() }));
vi.mock("@/hooks/useLocks", () => ({
  useLocks: vi.fn(() => ({ data: { locks: [] }, isLoading: false })),
  useMeSummary: vi.fn(() => ({ data: { balances: { investingUsd: 0, withdrawableUsd: 1500 } } })),
}));
vi.mock("@/hooks/usePortfolio", () => ({
  usePortfolio: vi.fn(() => ({ data: undefined, isLoading: false, isError: false })),
}));
vi.mock("@/hooks/useTelegram", () => ({
  useTelegram: () => ({
    haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
  }),
}));
vi.mock("@/hooks/useSharedNowMs", () => ({ useSharedNowMs: () => 1_700_000_000_000 }));
vi.mock("@/hooks/useWithdrawals", () => ({
  useWithdrawals: vi.fn(() => ({ data: [], isLoading: false })),
  useRequestWithdrawal: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    variables: undefined,
  })),
}));

import { useEarnings } from "@/hooks/useEarnings";
import EarningsPage from "@/app/(app)/earnings/page";
import type { EarningsSummary } from "@/types/earnings";

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

const load = (data: EarningsSummary | undefined, overrides = {}) =>
  vi.mocked(useEarnings).mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as never);

describe("Earnings page — calm-money redesign", () => {
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
    load({ ...loadedSummary, entries: [] });
    render(<EarningsPage />);
    expect(screen.getByText(/haven.t earned yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse marketplace/i })).toHaveAttribute(
      "href",
      "/marketplace",
    );
  });

  it("Total-earned hero, streak, static 12-week chart, income timeline, withdraw entry", () => {
    load(loadedSummary);
    render(<EarningsPage />);

    // Total earned is the hero (allTimeUsd), with the pending status pill.
    expect(screen.getByTestId("earnings-hero")).toBeInTheDocument();
    expect(screen.getByTestId("earnings-hero-amount")).toHaveTextContent("$120.00");
    expect(screen.getByText("Pending")).toBeInTheDocument();

    // Subtle paid-streak trust signal (1 paid week behind a pending current week).
    expect(screen.getByTestId("earnings-streak")).toHaveTextContent(/1 week in a row/i);

    // Upcoming payout (static date + estimate) on the hero.
    expect(screen.getByTestId("earnings-upcoming")).toBeInTheDocument();
    expect(screen.getByTestId("earnings-next-date")).toHaveTextContent(/Sun/i);
    expect(screen.getByTestId("earnings-next-amount")).toHaveTextContent("$33.75");

    // Static 12-week chart, no range/toggle controls.
    expect(screen.getByTestId("earnings-chart")).toBeInTheDocument();
    expect(screen.getAllByTestId("chart-bar").length).toBe(12);
    expect(screen.queryByTestId("chart-range-trigger")).not.toBeInTheDocument();
    expect(screen.queryByTestId("chart-mode-bar")).not.toBeInTheDocument();
    expect(screen.queryByText(/Last 8 weeks/i)).not.toBeInTheDocument();

    // Paid → Accruing → Next timeline.
    expect(screen.getByTestId("income-timeline")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-paid")).toHaveTextContent("$15.00");
    expect(screen.getByTestId("timeline-accruing")).toHaveTextContent("$15.00");
    expect(screen.getByTestId("timeline-next")).toHaveTextContent("$33.75");

    // Secondary Withdraw entry + withdrawable balance from useMeSummary.
    expect(screen.getByTestId("earnings-withdraw-block")).toBeInTheDocument();
    expect(screen.getByTestId("withdrawable-balance")).toHaveTextContent("$15.00");
    fireEvent.click(screen.getByTestId("earnings-withdraw-row"));
    expect(screen.getByTestId("withdrawal-request-sheet")).toBeInTheDocument();

    // No page-level PAYOUT_DISCLAIMER.
    expect(
      screen.queryByText("simulated weekly payout · on-chain verifiable post-MVP"),
    ).not.toBeInTheDocument();
  });
});
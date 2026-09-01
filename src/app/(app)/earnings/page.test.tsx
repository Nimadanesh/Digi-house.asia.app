import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

vi.mock("@/hooks/useEarnings", () => ({ useEarnings: vi.fn() }));
vi.mock("@/hooks/useMarketplace", () => ({ useMarketplace: vi.fn() }));
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
import { useMarketplace } from "@/hooks/useMarketplace";
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
  yield: {
    activeLocks: 1,
    lockedShares: 100,
    principalUsd: 1_200_000,
    accruedUnpaidUsd: 4_200,
    projectedInstallmentUsd: 6_000,
    projectedMonthlyUsd: 24_000,
    projectedWeeklyUsd: 6_000,
    payments: [],
  },
};

const load = (data: EarningsSummary | undefined, overrides = {}) =>
  vi.mocked(useEarnings).mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as never);

describe("Earnings page — income redesign (slice 5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Property metadata for the income-by-estate rows (existing marketplace contract).
    vi.mocked(useMarketplace).mockReturnValue({
      data: [
        {
          id: "prop-bayside-marina-penthouse",
          title: "Bayside Marina Penthouse",
          location: "Dubai Marina, UAE",
          images: ["/images/properties/bayside.png"],
        },
        {
          id: "prop-alfama-terrace-flat",
          title: "Alfama Terrace Flat",
          location: "Lisbon, Portugal",
          images: ["/images/properties/alfama.png"],
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
  });

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
    load({ ...loadedSummary, entries: [], yield: undefined });
    render(<EarningsPage />);
    expect(screen.getByText(/haven.t earned yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse marketplace/i })).toHaveAttribute(
      "href",
      "/marketplace",
    );
  });

  it("Income identity, received-in-total hero, Expected status word, timeline, accrued block, income by estate, withdraw entry", () => {
    load(loadedSummary);
    render(<EarningsPage />);

    // Income identity first (H1 + subtitle), no APY anywhere.
    expect(screen.getByRole("heading", { level: 1, name: /income/i })).toBeInTheDocument();
    expect(screen.getByText(/your share of the rental income/i)).toBeInTheDocument();

    // Hero = "Received in total" (paid money only), with the Expected status word —
    // the old Pending/Paid hero pill is gone.
    expect(screen.getByTestId("earnings-hero")).toBeInTheDocument();
    expect(screen.getByTestId("earnings-hero-amount")).toHaveTextContent("$120.00");
    expect(screen.getByText("Received in total")).toBeInTheDocument();
    expect(screen.queryByText("Pending")).not.toBeInTheDocument();

    // Subtle paid-streak trust signal (1 paid week behind a pending current week).
    expect(screen.getByTestId("earnings-streak")).toHaveTextContent(/1 week in a row/i);

    // Next distribution: status word Expected + pending-only amount.
    expect(screen.getByTestId("earnings-upcoming")).toBeInTheDocument();
    expect(screen.getByTestId("earnings-next-date")).toHaveTextContent(/Sun/i);
    expect(
      within(screen.getByTestId("earnings-upcoming")).getByText("Expected"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("earnings-next-amount")).toHaveTextContent("$33.75");

    // Accrued block (locked-share yield) — clearly separated from received.
    expect(screen.getByTestId("yield-summary-card")).toBeInTheDocument();
    expect(screen.getByTestId("yield-accrued-block")).toBeInTheDocument();
    expect(screen.getByTestId("yield-accrued-unpaid")).toHaveTextContent("$42.00");
    expect(screen.getAllByText(/paid with next distribution/i).length).toBeGreaterThan(0);

    // Static 12-week chart with two-tone legend, no range/toggle controls.
    expect(screen.getByTestId("earnings-chart")).toBeInTheDocument();
    expect(screen.getAllByTestId("chart-bar").length).toBe(12);
    expect(screen.getByTestId("chart-legend")).toBeInTheDocument();
    expect(screen.getByText("Projected")).toBeInTheDocument();
    expect(screen.queryByTestId("chart-range-trigger")).not.toBeInTheDocument();
    expect(screen.queryByTestId("chart-mode-bar")).not.toBeInTheDocument();

    // Paid → Accrued → Expected timeline (status words only).
    expect(screen.getByTestId("income-timeline")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-paid")).toHaveTextContent("$15.00");
    expect(screen.getByTestId("timeline-accrued")).toHaveTextContent("$42.00");
    expect(screen.getByTestId("timeline-next")).toHaveTextContent("$33.75");

    // Income by estate: per-estate rows link to estate detail, paid-only totals.
    expect(screen.getByTestId("income-by-estate")).toBeInTheDocument();
    const bayside = screen.getByTestId("income-by-estate-row-prop-bayside-marina-penthouse");
    expect(bayside).toHaveTextContent("Bayside Marina Penthouse");
    expect(bayside).toHaveTextContent("$15.00"); // 1 paid entry × $15
    expect(bayside).toHaveAttribute("href", "/property/prop-bayside-marina-penthouse");

    // Secondary Withdraw entry + withdrawable balance from useMeSummary.
    expect(screen.getByTestId("earnings-withdraw-block")).toBeInTheDocument();
    expect(screen.getByTestId("withdrawable-balance")).toHaveTextContent("$15.00");
    fireEvent.click(screen.getByTestId("earnings-withdraw-row"));
    expect(screen.getByTestId("withdrawal-request-sheet")).toBeInTheDocument();

    // No page-level PAYOUT_DISCLAIMER and no frequency promises ("weekly payout").
    expect(
      screen.queryByText("simulated weekly payout · on-chain verifiable post-MVP"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/monthly accrual/i)).not.toBeInTheDocument();
  });
});

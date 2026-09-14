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
import { useLocks, useMeSummary } from "@/hooks/useLocks";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useWithdrawals } from "@/hooks/useWithdrawals";
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
      propertyId: "re-108924",
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
      propertyId: "re-108924",
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
          id: "re-108924",
          title: "Syrene",
          location: "Sorrento, Amalfi Coast, Italy",
          images: ["/images/properties/villa-syrene-01.jpg"],
        },
        {
          id: "re-123861",
          title: "Villa du Cap",
          location: "Saint-Jean-Cap-Ferrat, France",
          images: ["/images/properties/villa-du-cap-01.jpg"],
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

    // Income journey chart: ranges + explorable paid/projected columns + legend.
    // (Slice I observatory replaces the static 12-week chart; bars are now
    // tappable columns with a detail panel.)
    expect(screen.getByTestId("income-journey")).toBeInTheDocument();
    expect(screen.getAllByTestId("journey-bar").length).toBe(12);
    expect(screen.getByTestId("journey-legend")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("journey-legend")).getByText("Projected"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("journey-ranges")).toBeInTheDocument();
    expect(screen.getByTestId("journey-detail")).toBeInTheDocument();

    // Paid → Accrued → Expected timeline (status words only).
    expect(screen.getByTestId("income-timeline")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-paid")).toHaveTextContent("$15.00");
    expect(screen.getByTestId("timeline-accrued")).toHaveTextContent("$42.00");
    expect(screen.getByTestId("timeline-next")).toHaveTextContent("$33.75");

    // Income by estate: per-estate rows link to estate detail, paid-only totals.
    // PROMPT 03-C: identity is canonical (ESTATE-24) even though the mocked
    // marketplace contract still carries legacy fixture facts.
    expect(screen.getByTestId("income-by-estate")).toBeInTheDocument();
    const bayside = screen.getByTestId("income-by-estate-row-re-108924");
    expect(bayside).toHaveTextContent("Villa Syrene");
    expect(bayside).toHaveTextContent("Sorrento, Amalfi Coast, Italy");
    expect(bayside).toHaveTextContent("$15.00"); // 1 paid entry × $15
    expect(bayside).toHaveAttribute("href", "/property/re-108924");

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

  it("payout pipeline distinguishes eligible, requested, scheduled and paid-out", () => {
    load(loadedSummary);
    vi.mocked(useWithdrawals).mockReturnValue({
      data: [
        {
          id: "wd-1",
          amountUsd: 10_000,
          feeUsd: 100,
          netUsd: 9_900,
          address: "EQtest",
          status: "requested",
          txHash: null,
          installments: [
            { seq: 1, amountUsd: 2_475, status: "paid", dueAt: "2026-07-08T00:00:00Z", paidAt: "2026-07-08T00:00:00Z", txHash: "sim:1" },
            { seq: 2, amountUsd: 2_475, status: "pending", dueAt: "2026-07-15T00:00:00Z", paidAt: null, txHash: null },
            { seq: 3, amountUsd: 2_475, status: "pending", dueAt: "2026-07-22T00:00:00Z", paidAt: null, txHash: null },
            { seq: 4, amountUsd: 2_475, status: "pending", dueAt: "2026-07-29T00:00:00Z", paidAt: null, txHash: null },
          ],
          createdAt: "2026-07-01T00:00:00Z",
          updatedAt: "2026-07-01T00:00:00Z",
        },
      ],
      isLoading: false,
    } as never);
    vi.mocked(useMeSummary).mockReturnValue({
      data: { balances: { investingUsd: 0, withdrawableUsd: 3_000 } },
    } as never);
    render(<EarningsPage />);

    expect(screen.getByTestId("dist-status")).toBeInTheDocument();
    expect(screen.getByTestId("dist-eligible")).toHaveTextContent("$30.00");
    expect(screen.getByTestId("dist-requested")).toHaveTextContent("$100.00");
    expect(screen.getByTestId("dist-scheduled")).toHaveTextContent("$74.25");
    expect(screen.getByTestId("dist-paidout")).toHaveTextContent("$24.75");
    // Requested money is never presented as received.
    expect(screen.getByTestId("earnings-hero-amount")).toHaveTextContent("$120.00");
  });

  it("empty pipeline renders honest empty lines, unknown balance renders Pending", () => {
    load(loadedSummary);
    vi.mocked(useWithdrawals).mockReturnValue({ data: [], isLoading: false } as never);
    vi.mocked(useMeSummary).mockReturnValue({ data: undefined, isLoading: false } as never);
    render(<EarningsPage />);

    expect(screen.getByTestId("dist-status")).toBeInTheDocument();
    expect(screen.getByTestId("dist-eligible")).toHaveTextContent("Pending");
    expect(screen.getByText("No payout requested")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("dist-scheduled")).getByText("Not scheduled"),
    ).toBeInTheDocument();
  });

  it("extends income-by-estate rows with position states when portfolio data exists", () => {
    load({
      ...loadedSummary,
      entries: [
        {
          id: "e1",
          userId: "u1",
          propertyId: "re-108924",
          weekOf: "2026-07-13T00:00:00Z",
          amountUsd: 1_500,
          tonAmount: 7_500_000_000,
          shareRatio: 0.075,
          status: "paid",
        },
        {
          id: "e2",
          userId: "u1",
          propertyId: "re-108924",
          weekOf: "2026-07-20T00:00:00Z",
          amountUsd: 500,
          tonAmount: 2_500_000_000,
          shareRatio: 0.075,
          status: "pending",
        },
      ],
    });
    vi.mocked(usePortfolio).mockReturnValue({
      data: {
        holdings: [
          {
            propertyId: "re-108924",
            sharesOwned: 160,
            avgCostUsd: 12_000,
            currentValueUsd: 1_920_000,
            pendingWeekEarningsUsd: 0,
            shareRatio: 0.16,
          },
        ],
        openOrders: [],
      },
      isLoading: false,
      isError: false,
    } as never);
    vi.mocked(useLocks).mockReturnValue({
      data: {
        locks: [
          {
            id: "lock-1",
            propertyId: "re-108924",
            shares: 100,
            principalUsd: 1_200_000,
            payoutPeriod: "monthly",
            monthlyRate: 6,
            status: "locked",
            lockedAt: "2026-07-01T00:00:00Z",
            unlockRequestedAt: null,
            maturedAt: null,
            nextPayoutAt: "2026-08-01T00:00:00Z",
            maturesAt: null,
            accruedUnpaidUsd: 4_200,
            installmentUsd: 5_000,
            projectedMonthlyUsd: 5_000,
            projectedWeeklyUsd: 1_200,
          },
        ],
      },
      isLoading: false,
    } as never);
    vi.mocked(useWithdrawals).mockReturnValue({ data: [], isLoading: false } as never);
    vi.mocked(useMeSummary).mockReturnValue({
      data: { balances: { investingUsd: 0, withdrawableUsd: 1_500 } },
    } as never);
    render(<EarningsPage />);

    const row = screen.getByTestId("income-by-estate-row-re-108924");
    expect(row).toHaveTextContent("160 shares");
    expect(row).toHaveTextContent("$5.00"); // projected (pending ledger only)
    expect(row).toHaveTextContent("$42.00"); // accrued (lock engine only)
    expect(row).toHaveTextContent("$15.00"); // paid (paid ledger only)
  });

  it("other returns stay honest with no plans, no history and no listings", () => {
    load(loadedSummary);
    vi.mocked(useWithdrawals).mockReturnValue({ data: [], isLoading: false } as never);
    vi.mocked(useMeSummary).mockReturnValue({
      data: { balances: { investingUsd: 0, withdrawableUsd: 1_500 } },
    } as never);
    vi.mocked(usePortfolio).mockReturnValue({
      data: { holdings: [], openOrders: [] },
      isLoading: false,
      isError: false,
    } as never);
    render(<EarningsPage />);

    expect(screen.getByTestId("other-returns")).toBeInTheDocument();
    expect(screen.getByTestId("other-plan")).toHaveTextContent("No investment plans configured");
    expect(screen.getByTestId("other-appreciation")).toHaveTextContent("Pending");
    expect(screen.getByText("No open listings")).toBeInTheDocument();
    expect(screen.getByTestId("income-origin")).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the hooks BEFORE importing the page (vi.mock hoists).
vi.mock("@/hooks/useEarnings", () => ({
  useEarnings: vi.fn(),
}));
vi.mock("@/hooks/useMarketplace", () => ({
  useMarketplace: vi.fn(() => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() })),
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
      weekOf: "2026-07-20T00:00:00Z",
      amountUsd: 1_500,
      tonAmount: 7_500_000,
      shareRatio: 0.075,
      status: "paid",
      txHash: "simulated:abc",
    },
  ],
};

describe("Earnings page — honesty contract + states", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the PAYOUT_DISCLAIMER exactly once (MVP honesty contract)", () => {
    vi.mocked(useEarnings).mockReturnValue({ data: loadedSummary, isLoading: false, isError: false, refetch: vi.fn() } as never);
    render(<EarningsPage />);
    expect(screen.getAllByText("simulated weekly payout · on-chain verifiable post-MVP").length).toBe(1);
  });

  it("loaded: renders the hero this-week projected amount in tabular-nums", () => {
    vi.mocked(useEarnings).mockReturnValue({ data: loadedSummary, isLoading: false, isError: false, refetch: vi.fn() } as never);
    render(<EarningsPage />);
    expect(screen.getByText("$33.75")).toHaveClass("tnum");
  });

  it("loading: renders skeleton placeholders (no spinner replacing the list)", () => {
    vi.mocked(useEarnings).mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() } as never);
    const { container } = render(<EarningsPage />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("empty: renders the EmptyState with 'No earnings yet'", () => {
    vi.mocked(useEarnings).mockReturnValue({ data: { ...loadedSummary, entries: [] }, isLoading: false, isError: false, refetch: vi.fn() } as never);
    render(<EarningsPage />);
    expect(screen.getByText("No earnings yet")).toBeInTheDocument();
  });

  it("error: renders the Retry button", () => {
    vi.mocked(useEarnings).mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() } as never);
    render(<EarningsPage />);
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
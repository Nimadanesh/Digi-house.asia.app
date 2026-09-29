import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PortfolioSummary } from "@/types/position";

const usePortfolio = vi.fn();
vi.mock("@/hooks/usePortfolio", () => ({ usePortfolio: () => usePortfolio() }));

import { ClubTierPodium } from "@/components/club/ClubTierPodium";
import ClubPage from "@/app/(app)/club/page";

function loaded(investedUsd: number) {
  const summary: PortfolioSummary = {
    totalValueUsd: investedUsd,
    totalInvestedUsd: investedUsd,
    totalEarningsUsd: 0,
    weeklyProjectedUsd: 0,
    dayChangeRatio: 0,
    holdings: [],
    openOrders: [],
  };
  usePortfolio.mockReturnValue({
    data: summary,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
}

describe("ClubTierPodium", () => {
  it("renders the headline, the three cards, and the tagline", () => {
    render(<ClubTierPodium />);
    expect(screen.getByTestId("club-podium")).toBeInTheDocument();
    expect(screen.getByTestId("podium-headline")).toHaveTextContent("Shine like stars");
    expect(screen.getByTestId("podium-card-signature")).toBeInTheDocument();
    expect(screen.getByTestId("podium-card-elite")).toBeInTheDocument();
    expect(screen.getByTestId("podium-card-private-plus")).toBeInTheDocument();
    expect(screen.getByTestId("podium-tagline")).toHaveTextContent(
      "A private circle for those who refuse to be ordinary.",
    );
  });

  it("hierarchy: Signature carries number 1, label, and the $500,000+ threshold", () => {
    render(<ClubTierPodium />);
    const hero = screen.getByTestId("podium-card-signature");
    expect(hero).toHaveTextContent("1");
    expect(hero).toHaveTextContent("Signature");
    expect(hero).toHaveTextContent("$500,000+");
    // Side cards carry only number + label.
    const elite = screen.getByTestId("podium-card-elite");
    expect(elite).toHaveTextContent("2");
    expect(elite).toHaveTextContent("Elite");
    const priv = screen.getByTestId("podium-card-private-plus");
    expect(priv).toHaveTextContent("3");
    expect(priv).toHaveTextContent("Private+");
  });

  it("decorative cards are aria-hidden; the section is labeled, not interactive", () => {
    render(<ClubTierPodium />);
    expect(screen.getByTestId("podium-card-signature")).not.toHaveAttribute("aria-hidden");
    expect(screen.getByTestId("podium-card-elite")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("podium-card-private-plus")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("region", { name: "Membership tier podium" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("page order: podium → membership card → card progress → benefits", () => {
    loaded(1_500_000);
    const { container } = render(<ClubPage />);
    const ids = [
      "club-podium",
      "club-card",
      "club-card-progress",
      "club-benefits",
      "club-circle",
      "club-escape",
      "club-referral",
      "club-next-unlock",
      "club-tiers",
    ];
    const els = ids.map((id) => container.querySelector(`[data-testid="${id}"]`));
    expect(els.every(Boolean)).toBe(true);
    for (let i = 1; i < els.length; i++) {
      expect(els[i - 1]!.compareDocumentPosition(els[i]!)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    }
    // The progress bar sits directly under the membership card wrapper.
    expect(screen.getByTestId("club-card-progress")).toHaveTextContent("to unlock");
  });
});

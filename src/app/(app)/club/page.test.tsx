import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { PortfolioSummary } from "@/types/position";

const usePortfolio = vi.fn();
vi.mock("@/hooks/usePortfolio", () => ({ usePortfolio: () => usePortfolio() }));

import ClubPage from "@/app/(app)/club/page";

function summary(investedUsd: number): PortfolioSummary {
  return {
    totalValueUsd: investedUsd,
    totalInvestedUsd: investedUsd,
    totalEarningsUsd: 0,
    weeklyProjectedUsd: 0,
    dayChangeRatio: 0,
    holdings: [],
    openOrders: [],
  };
}

function loaded(investedUsd: number) {
  usePortfolio.mockReturnValue({
    data: summary(investedUsd),
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
}

describe("Club page", () => {
  it("loading: skeleton", () => {
    usePortfolio.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() });
    render(<ClubPage />);
    expect(screen.getByTestId("club-loading")).toBeInTheDocument();
  });

  it("error: retry", () => {
    usePortfolio.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() });
    render(<ClubPage />);
    expect(screen.getByText("Couldn't load your club.")).toBeInTheDocument();
  });

  it("$15,000 → private member, exact section order, no raw keys", () => {
    loaded(1_500_000);
    const { container } = render(<ClubPage />);

    expect(screen.getByTestId("club-page")).toBeInTheDocument();
    expect(screen.getByTestId("club-header")).toHaveTextContent("Private Member");
    expect(screen.getByTestId("club-card")).toHaveTextContent("Private Member");
    expect(screen.getAllByTestId("club-benefit")).toHaveLength(6);
    expect(screen.getByTestId("club-next-unlock")).toHaveTextContent("Private Plus");
    expect(screen.getAllByTestId("club-tier")).toHaveLength(5);

    // Exact order: header → card → benefits → circle → escape → referral → next → tiers.
    const ids = ["club-header", "club-card", "club-benefits", "club-circle", "club-escape", "club-referral", "club-next-unlock", "club-tiers"];
    const els = ids.map((id) => container.querySelector(`[data-testid="${id}"]`));
    expect(els.every(Boolean)).toBe(true);
    for (let i = 1; i < els.length; i++) {
      expect(els[i - 1]!.compareDocumentPosition(els[i]!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    }

    // No raw i18n keys leak into the rendered copy.
    expect(container.textContent).not.toMatch(/club\.[a-z]/);
  });

  it("$7,500 → standard with $2,500 to Private", () => {
    loaded(750_000);
    render(<ClubPage />);
    expect(screen.getByTestId("club-header")).toHaveTextContent("Standard Member");
    expect(screen.getByTestId("club-next-unlock")).toHaveTextContent("$2,500.00 to unlock Private");
  });

  it("no Club Lifestyle Value is rendered anywhere on the page", () => {
    loaded(1_500_000);
    const { container } = render(<ClubPage />);
    expect(screen.queryByTestId("club-lifestyle")).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/lifestyle value/i);
    expect(container.textContent).not.toMatch(/cashback|money back| guaranteed return/i);
  });

  it("referral is a concise entry to the Hub — no ladder duplicated on Club", () => {
    loaded(1_500_000);
    render(<ClubPage />);
    const section = screen.getByTestId("club-referral");
    expect(section).toHaveTextContent("Referral rewards");
    expect(section).toHaveTextContent("Milestones, points, and stay rewards live in the Referral Hub.");
    expect(screen.getByTestId("club-referral-cta")).toHaveTextContent("Open Referral");
    expect(screen.getByTestId("club-referral-cta")).toHaveAttribute("href", "/referral");
    expect(section.textContent).not.toMatch(/\$\d|%/);
    // Full mechanics live in the Hub, not on Club.
    expect(screen.queryByTestId("club-referral-progress")).not.toBeInTheDocument();
    expect(screen.queryByTestId("referral-milestone")).not.toBeInTheDocument();
    // A11y: header progressbar has an accessible name.
    expect(screen.getByRole("progressbar").getAttribute("aria-label")).toMatch(/to unlock/i);
    // A11y: tier rows expose their state.
    screen.getAllByTestId("club-tier").forEach((row) => {
      expect(row.getAttribute("aria-label")).toBeTruthy();
    });
  });

  it("luxe circle renders the honest empty network", () => {
    loaded(1_500_000);
    render(<ClubPage />);
    const section = screen.getByTestId("club-circle");
    expect(section).toHaveTextContent("Your Luxe Circle");
    expect(screen.getByTestId("circle-counts")).toHaveTextContent("0 Members");
    expect(screen.getByTestId("circle-counts")).toHaveTextContent("0 Shared Properties");
    expect(screen.getByTestId("circle-invite")).toHaveAttribute("href", "/marketplace");
    expect(screen.getByTestId("circle-shared-empty")).toHaveTextContent("No shared properties yet.");
    expect(screen.getByTestId("circle-explore")).toHaveAttribute("href", "/marketplace");
    expect(section.textContent).not.toMatch(/[1-9]\d* Members/);
  });
  it("standard members do not enter the stay journey", () => {
    loaded(750_000);
    render(<ClubPage />);
    expect(screen.queryByTestId("club-stay")).not.toBeInTheDocument();
  });

  it("private members see the unlocked stay with a preferences CTA", () => {
    loaded(1_500_000);
    render(<ClubPage />);
    const section = screen.getByTestId("club-stay");
    expect(section).toHaveTextContent("You've unlocked your 4-night Club stay.");
    expect(screen.getByTestId("club-stay-cta")).toHaveTextContent("Set preferences");
    expect(section.textContent).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it("saving preferences reveals the estimated window and countdown, never exact dates", async () => {
    const { within } = await import("@testing-library/react");
    const { useStayJourneyStore } = await import("@/stores/stay-journey.store");
    useStayJourneyStore.getState().clearPreference();
    loaded(1_500_000);
    render(<ClubPage />);
    fireEvent.click(screen.getByTestId("club-stay-cta"));
    const sheet = within(screen.getByTestId("club-stay-sheet"));
    fireEvent.click(sheet.getByText("Summer"));
    fireEvent.click(sheet.getByText("2"));
    fireEvent.click(sheet.getByText("Anniversary"));
    fireEvent.click(sheet.getByText("Couple"));
    fireEvent.click(sheet.getByText("Beach"));
    fireEvent.click(sheet.getByText("Caribbean"));
    fireEvent.click(screen.getByTestId("club-stay-save"));
    expect(screen.queryByTestId("club-stay-sheet")).not.toBeInTheDocument();
    const section = screen.getByTestId("club-stay");
    expect(section).toHaveTextContent("Your Club stay is being prepared");
    expect(section).toHaveTextContent("Expected stay window:");
    expect(screen.getByTestId("club-stay-countdown")).toBeInTheDocument();
    expect(section.textContent).not.toMatch(/Your reservation/i);
    expect(section.textContent).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    useStayJourneyStore.getState().clearPreference();
  });
  it("benefit tile opens the richer detail sheet", () => {
    loaded(1_500_000);
    render(<ClubPage />);
    fireEvent.click(screen.getAllByTestId("club-benefit")[0]!);
    const panel = screen.getByTestId("sheet-panel");
    // A11y: dialog carries the sheet title as its accessible name.
    expect(panel.getAttribute("aria-labelledby")).toBe("club-benefit-sheet-title");
    expect(document.getElementById("club-benefit-sheet-title")).not.toBeNull();
    expect(panel).toHaveTextContent("Villa Stay");
    expect(panel).toHaveTextContent("What it is");
    expect(panel).toHaveTextContent("Who can access it");
    expect(panel).toHaveTextContent("Unlocked at Private and above");
    expect(panel).toHaveTextContent("How it works");
  });

  it("escape section opens the gift sheet with occasions", () => {
    loaded(1_500_000);
    render(<ClubPage />);
    expect(screen.getByTestId("club-escape")).toHaveTextContent(
      "Give someone special an unforgettable experience.",
    );
    fireEvent.click(screen.getByTestId("club-escape-cta"));
    const panel = screen.getByTestId("sheet-panel");
    expect(panel).toHaveTextContent("Choose an occasion");
    expect(panel).toHaveTextContent("Valentine's Day");
    expect(panel).toHaveTextContent("The destination");
    expect(panel).toHaveTextContent("The invitation");
  });

  it("tiers carry past/current/future states with a CURRENT marker", () => {
    loaded(1_500_000);
    render(<ClubPage />);
    const rows = screen.getAllByTestId("club-tier");
    expect(rows[0]).toHaveAttribute("data-state", "past");
    expect(rows[1]).toHaveAttribute("data-state", "current");
    expect(rows[2]).toHaveAttribute("data-state", "future");
    expect(rows[1]).toHaveTextContent("Current");
  });

  it("tier row opens the tier sheet with threshold and description", () => {
    loaded(1_500_000);
    render(<ClubPage />);
    fireEvent.click(screen.getAllByTestId("club-tier")[2]!);
    const panel = screen.getByTestId("sheet-panel");
    expect(panel).toHaveTextContent("Private Plus Member");
    expect(panel).toHaveTextContent("$25,000.00+");
    expect(panel).toHaveTextContent("Concierge");
  });

  it("$500,000 → signature completion state, no fake unlock", () => {
    loaded(50_000_000);
    render(<ClubPage />);
    expect(screen.getByTestId("club-header")).toHaveTextContent("Signature Member");
    expect(screen.getByTestId("club-header")).toHaveTextContent("Highest prototype tier");
    expect(screen.getByTestId("club-next-unlock")).toHaveTextContent("No higher Club level");
  });
});

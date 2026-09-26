import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import type { PortfolioSummary } from "@/types/position";

const { copyInviteMock, shareInviteMock, usePortfolioMock } = vi.hoisted(() => ({
  copyInviteMock: vi.fn(),
  shareInviteMock: vi.fn(),
  usePortfolioMock: vi.fn(),
}));

vi.mock("@/hooks/usePortfolio", () => ({ usePortfolio: () => usePortfolioMock() }));
vi.mock("@/hooks/useInviteLink", () => ({
  useInviteLink: () => ({
    inviteLink: "https://t.me/Bot?startapp=ref_u1",
    canInvite: true,
    copied: false,
    copyInvite: copyInviteMock,
    shareInvite: shareInviteMock,
  }),
}));

import ReferralPage from "@/app/(app)/referral/page";

const baseSummary: PortfolioSummary = {
  totalValueUsd: 250_000,
  totalInvestedUsd: 240_000,
  totalEarningsUsd: 12_000,
  weeklyProjectedUsd: 3_375,
  dayChangeRatio: 0.023,
  holdings: [],
  openOrders: [],
};

function loaded(totalInvestedUsd: number) {
  usePortfolioMock.mockReturnValue({
    data: { ...baseSummary, totalInvestedUsd },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
}

describe("Referral hub page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hero: eyebrow, headline, support copy, and both CTAs", () => {
    loaded(240_000);
    render(<ReferralPage />);
    expect(screen.getByTestId("referral-page")).toBeInTheDocument();
    expect(screen.getByTestId("referral-hero")).toBeInTheDocument();
    expect(screen.getByText("Invite. Grow. Unlock more.")).toBeInTheDocument();
    expect(screen.getByTestId("referral-hero-invite")).toBeInTheDocument();
    expect(screen.getByTestId("referral-hero-how")).toBeInTheDocument();
    expect(screen.getByTestId("referral-switcher")).toBeInTheDocument();
    expect(screen.getByTestId("referral-tab-standard")).toBeInTheDocument();
    expect(screen.getByTestId("referral-tab-club")).toBeInTheDocument();
  });

  it("standard user defaults to the Standard tab", () => {
    loaded(240_000);
    render(<ReferralPage />);
    expect(screen.getByTestId("referral-tab-standard")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("referral-standard-view")).toBeInTheDocument();
    expect(screen.queryByTestId("referral-club-view")).not.toBeInTheDocument();
  });

  it("club member defaults to the Club tab", () => {
    loaded(1_200_000);
    render(<ReferralPage />);
    expect(screen.getByTestId("referral-tab-club")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("referral-club-view")).toBeInTheDocument();
    expect(screen.queryByTestId("referral-standard-view")).not.toBeInTheDocument();
  });

  it("switcher toggles between Standard and Club views", () => {
    loaded(240_000);
    render(<ReferralPage />);
    fireEvent.click(screen.getByTestId("referral-tab-club"));
    expect(screen.getByTestId("referral-club-view")).toBeInTheDocument();
    expect(screen.queryByTestId("referral-standard-view")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("referral-tab-standard"));
    expect(screen.getByTestId("referral-standard-view")).toBeInTheDocument();
    expect(screen.queryByTestId("referral-club-view")).not.toBeInTheDocument();
  });

  it("standard view: 3-band ladder, $100K+ custom note, 2 labeled examples, how-it-works, lock panel", () => {
    loaded(240_000);
    render(<ReferralPage />);
    expect(screen.getByTestId("referral-ladder")).toBeInTheDocument();
    expect(screen.getAllByTestId("referral-band")).toHaveLength(3);
    expect(screen.getByTestId("referral-custom-note")).toHaveTextContent(/contact club/i);
    const examples = screen.getAllByTestId("referral-example");
    expect(examples).toHaveLength(2);
    expect(screen.getByTestId("referral-examples")).toHaveTextContent(/example/i);
    const exampleBlock = within(screen.getByTestId("referral-examples"));
    expect(exampleBlock.getByText(/20,000/)).toBeInTheDocument();
    expect(exampleBlock.getByText(/1,500/)).toBeInTheDocument();
    expect(exampleBlock.getByText(/50,000/)).toBeInTheDocument();
    expect(exampleBlock.getByText(/5,000/)).toBeInTheDocument();
    expect(screen.getAllByTestId("referral-how-step")).toHaveLength(3);
    expect(screen.getByTestId("referral-lock")).toHaveTextContent(/6-month/i);
    fireEvent.click(screen.getByTestId("referral-nudge-club"));
    expect(screen.getByTestId("referral-club-view")).toBeInTheDocument();
  });

  it("standard CTAs invoke copy and share", () => {
    loaded(240_000);
    render(<ReferralPage />);
    fireEvent.click(screen.getByTestId("referral-cta-invite"));
    expect(copyInviteMock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("referral-cta-share"));
    expect(shareInviteMock).toHaveBeenCalledTimes(1);
  });

  it("club view: progress, milestone ladder, stay enhancement, Plus layer, tier-unchanged note", () => {
    loaded(1_200_000);
    render(<ReferralPage />);
    expect(screen.getByTestId("referral-club-progress")).toBeInTheDocument();
    // Zero-state honesty: no "next" reward when the next milestone changes nothing.
    expect(screen.queryByText(/Next: 4-night/)).not.toBeInTheDocument();
    // A11y: locked milestone states + named progressbar.
    screen.getAllByTestId("referral-milestone").forEach((m) => {
      expect(m).toHaveTextContent(/locked/i);
    });
    expect(screen.getByRole("progressbar").getAttribute("aria-label")).toBeTruthy();
    expect(screen.getAllByTestId("referral-milestone")).toHaveLength(5);
    expect(screen.getByTestId("referral-stay")).toHaveTextContent(/7/);
    expect(screen.getByTestId("referral-stay")).not.toHaveTextContent(/Your Club stay: 7/);
    expect(screen.getByTestId("referral-plus")).toBeInTheDocument();
    expect(screen.getByTestId("referral-tier-note")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("referral-club-cta"));
    expect(copyInviteMock).toHaveBeenCalledTimes(1);
  });

  it("portfolio loading still renders hero, switcher, and standard content", () => {
    usePortfolioMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });
    render(<ReferralPage />);
    expect(screen.getByTestId("referral-hero")).toBeInTheDocument();
    expect(screen.getByTestId("referral-switcher")).toBeInTheDocument();
    expect(screen.getByTestId("referral-standard-view")).toBeInTheDocument();
  });

  it("portfolio error still renders hero and switcher with retry", () => {
    usePortfolioMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });
    render(<ReferralPage />);
    expect(screen.getByTestId("referral-hero")).toBeInTheDocument();
    expect(screen.getByTestId("referral-switcher")).toBeInTheDocument();
    expect(screen.getByTestId("referral-retry")).toBeInTheDocument();
  });

  it("never combines points and dollars into one balance", () => {
    loaded(240_000);
    render(<ReferralPage />);
    fireEvent.click(screen.getByTestId("referral-tab-club"));
    expect(screen.queryByTestId("referral-balance")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("referral-tab-standard"));
    expect(screen.queryByTestId("referral-balance")).not.toBeInTheDocument();
  });
});

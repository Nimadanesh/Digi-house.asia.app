import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { Listing } from "@/types/property";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

const listings: Listing[] = [
  {
    id: "prop-a",
    title: "Alpha Marina",
    location: "Dubai",
    description: "A",
    images: ["/images/properties/p1.png"],
    totalShares: 400,
    sharePriceUsd: 12500,
    status: "funding",
    ownerWalletAddress: "EQA",
    annualRentUsd: 900000,
    createdAt: "2026-07-20T00:00:00Z",
    sharesSold: 320,
    sharesRemaining: 80,
    fundingProgressRatio: 0.8,
    monthlyYieldRate: 6.25,
    totalValueUsd: 8_000_000,
    meta: {
      sizeSqm: 70,
      yearBuilt: 2020,
      propertyType: "Apt",
      rentalStatus: "rented",
      leaseUntil: "2026-12-31",
      activeTenant: true,
      tokenizationDocUrl: "#",
    },
    rentalHistory: [],
  },
  {
    id: "prop-b",
    title: "Beta Loft",
    location: "Lisbon",
    description: "B",
    images: ["/images/properties/p2.png"],
    totalShares: 800,
    sharePriceUsd: 5000,
    status: "resale",
    ownerWalletAddress: "EQB",
    annualRentUsd: 200000,
    createdAt: "2026-01-01T00:00:00Z",
    sharesSold: 800,
    sharesRemaining: 0,
    fundingProgressRatio: 1,
    monthlyYieldRate: 6.25,
    lastTradeUsd: 5100,
    totalValueUsd: 8_000_000,
    meta: {
      sizeSqm: 40,
      yearBuilt: 2021,
      propertyType: "Studio",
      rentalStatus: "rented",
      leaseUntil: "2027-01-01",
      activeTenant: true,
      tokenizationDocUrl: "#",
    },
    rentalHistory: [],
  },
];

import { toMarketplaceEstates } from "@/lib/economics/marketplace-view-model";

const useMarketplaceEstates = vi.fn();
vi.mock("@/hooks/useMarketplaceEstates", () => ({
  useMarketplaceEstates: () => useMarketplaceEstates(),
}));

function mockEstates() {
  return toMarketplaceEstates(listings);
}
vi.mock("@/hooks/useTelegram", () => ({
  useTelegram: () => ({
    haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
  }),
}));

import MarketplacePage from "@/app/(app)/marketplace/page";

describe("Estates (marketplace) page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loading: skeleton for search, chips, sort and cards", () => {
    useMarketplaceEstates.mockReturnValue({ estates: [], isLoading: true, isError: false, refetch: vi.fn() });
    render(<MarketplacePage />);
    expect(screen.getByTestId("estates-skeleton")).toBeInTheDocument();
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("error: Retry", () => {
    useMarketplaceEstates.mockReturnValue({ estates: [], isLoading: false, isError: true, refetch: vi.fn() });
    render(<MarketplacePage />);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("empty estate list", () => {
    useMarketplaceEstates.mockReturnValue({ estates: [], isLoading: false, isError: false, refetch: vi.fn() });
    render(<MarketplacePage />);
    expect(screen.getByText("No estates yet")).toBeInTheDocument();
  });

  it("loaded: Estates header, search, the six Phase 9 filters, sort and cards", () => {
    useMarketplaceEstates.mockReturnValue({ estates: mockEstates(), isLoading: false, isError: false, refetch: vi.fn() });
    render(<MarketplacePage />);
    expect(screen.getByRole("heading", { name: "Estates" })).toBeInTheDocument();
    expect(screen.getByText("Own a share of exceptional properties.")).toBeInTheDocument();
    expect(screen.getByTestId("estates-search")).toBeInTheDocument();
    expect(screen.getByTestId("estates-filters")).toBeInTheDocument();
    for (const label of ["All", "Featured", "New", "Income", "Owner Stay", "Resale"]) {
      expect(screen.getByRole("tab", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByTestId("estates-sort")).toBeInTheDocument();
    expect(screen.getByText("Alpha Marina")).toBeInTheDocument();
    expect(screen.getByText("Beta Loft")).toBeInTheDocument();
    // Funding estate shows availability; resale shows Last price.
    expect(screen.getByText("80% funded · 80 shares remaining")).toBeInTheDocument();
    expect(screen.getByText("Last price")).toBeInTheDocument();
    // Ownership fraction and projected income on cards.
    expect(screen.getByText("1 share ≈ 1/400 of the estate")).toBeInTheDocument();
    expect(screen.getAllByText("Projected income / share").length).toBeGreaterThan(0);
  });

  it("search filters the list client-side", async () => {
    useMarketplaceEstates.mockReturnValue({ estates: mockEstates(), isLoading: false, isError: false, refetch: vi.fn() });
    render(<MarketplacePage />);
    fireEvent.change(screen.getByLabelText("Search villas, destinations or regions."), {
      target: { value: "lisbon" },
    });
    await waitFor(() => {
      expect(screen.queryByText("Alpha Marina")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Beta Loft")).toBeInTheDocument();
  });

  it("default sort is Curated — feed order, not highest yield", () => {
    useMarketplaceEstates.mockReturnValue({ estates: mockEstates(), isLoading: false, isError: false, refetch: vi.fn() });
    render(<MarketplacePage />);
    const cards = screen.getAllByTestId("property-card");
    expect(cards[0]).toHaveTextContent("Alpha Marina");
    expect(cards[1]).toHaveTextContent("Beta Loft");
    expect(screen.getByRole("button", { name: /curated/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("Entry price sort reorders by share price", () => {
    useMarketplaceEstates.mockReturnValue({ estates: mockEstates(), isLoading: false, isError: false, refetch: vi.fn() });
    render(<MarketplacePage />);
    fireEvent.click(screen.getByRole("button", { name: "Entry price" }));
    const cards = screen.getAllByTestId("property-card");
    expect(cards[0]).toHaveTextContent("Beta Loft");
    expect(cards[1]).toHaveTextContent("Alpha Marina");
  });

  it("Resale filter keeps only resale estates", () => {
    useMarketplaceEstates.mockReturnValue({ estates: mockEstates(), isLoading: false, isError: false, refetch: vi.fn() });
    render(<MarketplacePage />);
    fireEvent.click(screen.getByRole("tab", { name: "Resale" }));
    const cards = screen.getAllByTestId("property-card");
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveTextContent("Beta Loft");
  });

  it("Owner Stay filter shows the honest unavailable empty state — no fake matches", () => {
    useMarketplaceEstates.mockReturnValue({ estates: mockEstates(), isLoading: false, isError: false, refetch: vi.fn() });
    render(<MarketplacePage />);
    fireEvent.click(screen.getByRole("tab", { name: "Owner Stay" }));
    expect(screen.getByText("Owner Stay data is not available yet.")).toBeInTheDocument();
    expect(screen.queryAllByTestId("property-card").length).toBe(0);
  });

  it("Featured filter shows the honest unavailable empty state — no fake matches", () => {
    useMarketplaceEstates.mockReturnValue({ estates: mockEstates(), isLoading: false, isError: false, refetch: vi.fn() });
    render(<MarketplacePage />);
    fireEvent.click(screen.getByRole("tab", { name: "Featured" }));
    expect(screen.getByText("Featured curation is not available yet.")).toBeInTheDocument();
    expect(screen.queryAllByTestId("property-card").length).toBe(0);
  });

  it("no-match empty state clears filters", async () => {
    useMarketplaceEstates.mockReturnValue({ estates: mockEstates(), isLoading: false, isError: false, refetch: vi.fn() });
    render(<MarketplacePage />);
    fireEvent.change(screen.getByLabelText("Search villas, destinations or regions."), {
      target: { value: "zzzz" },
    });
    await waitFor(() => {
      expect(screen.getByText("No matches")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));
    await waitFor(() => {
      expect(screen.getByText("Alpha Marina")).toBeInTheDocument();
    });
  });

  it("Slice F: Estate value sort is offered and reorders deterministically", async () => {
    const { PROPERTIES } = await import("@/lib/mock/seed/properties");
    const { toMarketplaceEstates: toVM } = await import("@/lib/economics/marketplace-view-model");
    useMarketplaceEstates.mockReturnValue({ estates: toVM(PROPERTIES), isLoading: false, isError: false, refetch: vi.fn() });
    render(<MarketplacePage />);
    const valueSort = screen.getByRole("button", { name: "Estate value" });
    expect(valueSort).toBeInTheDocument();
    fireEvent.click(valueSort);
    const cards = screen.getAllByTestId("property-card");
    expect(cards.length).toBe(24);
    // Highest approved Estate Value first (Pearls of Long Bay).
    expect(cards[0]).toHaveTextContent("Pearls of Long Bay Estate");
  });

  it("Slice F: search matches canonical identity (Raa Atoll → Grand 2 BDM)", async () => {
    const { PROPERTIES } = await import("@/lib/mock/seed/properties");
    const { toMarketplaceEstates: toVM } = await import("@/lib/economics/marketplace-view-model");
    useMarketplaceEstates.mockReturnValue({ estates: toVM(PROPERTIES), isLoading: false, isError: false, refetch: vi.fn() });
    render(<MarketplacePage />);
    fireEvent.change(screen.getByLabelText("Search villas, destinations or regions."), {
      target: { value: "Raa Atoll" },
    });
    await waitFor(() => {
      expect(screen.queryByText("Pearls of Long Bay Estate")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Grand 2 BDM Ocean Pool Villa (JOALI Being)")).toBeInTheDocument();
    expect(screen.getAllByTestId("property-card")).toHaveLength(1);
  });
});
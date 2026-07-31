import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import type { Listing } from "@/types/property";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

const listing: Listing = {
  id: "prop-marina-vista-4b",
  title: "Marina Vista Apt 4B",
  location: "Dubai Marina, UAE",
  description: "Waterfront one-bedroom.",
  images: ["/images/properties/p1.png"],
  totalShares: 1000,
  sharePriceUsd: 12500,
  status: "funding",
  ownerWalletAddress: "EQAtest",
  annualRentUsd: 520000,
  createdAt: "2026-01-12T09:00:00Z",
  sharesSold: 640,
  sharesRemaining: 360,
  fundingProgressRatio: 0.64,
  meta: {
    sizeSqm: 72,
    yearBuilt: 2019,
    propertyType: "Apartment",
    rentalStatus: "rented",
    leaseUntil: "2026-12-31",
    activeTenant: true,
    tokenizationDocUrl: "#tokenization-demo",
  },
  rentalHistory: [{ id: "r1", paidAt: "2026-07-04", status: "paid" }],
};

const useProperty = vi.fn(() => ({
  data: undefined as Listing | undefined,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}));
const useOrderBook = vi.fn(() => ({ data: undefined }));

const haptics = { impact: vi.fn(), notification: vi.fn(), selection: vi.fn() };
let mainHandler: (() => void | Promise<void>) | null = null;
const mainButton = {
  setParams: vi.fn(),
  hide: vi.fn(),
  onClick: vi.fn((fn: () => void | Promise<void>) => {
    mainHandler = fn;
    return () => {
      mainHandler = null;
    };
  }),
};
const backButton = {
  show: vi.fn(),
  hide: vi.fn(),
  onClick: vi.fn(() => () => {}),
};

vi.mock("@/hooks/useProperty", () => ({
  useProperty: () => useProperty(),
}));
vi.mock("@/hooks/useOrderBook", () => ({
  useOrderBook: () => useOrderBook(),
}));
vi.mock("@/hooks/usePropertyDocuments", () => ({
  usePropertyDocuments: () => ({
    documents: [],
    isLoading: false,
    isError: false,
    error: null,
    download: { mutateAsync: vi.fn() },
  }),
}));
vi.mock("@/hooks/useTelegram", () => ({
  useTelegram: () => ({
    ready: true,
    isDark: true,
    viewport: { width: 390, height: 800, stableHeight: 800, isExpanded: true },
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
    backButton,
    mainButton,
    haptics,
    themeParams: {},
  }),
}));
vi.mock("@/hooks/useTonConnect", () => ({
  useTonConnect: () => ({
    connected: true,
    openModal: vi.fn(),
    address: "EQxxx",
    short: "EQxx…",
    restoring: false,
    network: "testnet",
    disconnect: vi.fn(),
    send: vi.fn(),
  }),
}));
const mutateAsync = vi.fn();
vi.mock("@/hooks/useBuyShares", () => ({
  useBuyShares: () => ({ mutateAsync, isPending: false, phase: "idle" }),
}));
vi.mock("@/stores/ui.store", () => ({
  useUiStore: (sel: (s: { setMainButtonActive: (v: boolean) => void }) => unknown) =>
    sel({ setMainButtonActive: vi.fn() }),
}));

import PropertyDetailPage from "@/app/(app)/property/[id]/page";

async function renderPage(id: string) {
  const params = Promise.resolve({ id });
  await act(async () => {
    render(<PropertyDetailPage params={params} />);
    await params;
  });
}

describe("Property detail page — states + buy happy path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mainHandler = null;
    mutateAsync.mockResolvedValue({ ok: true, txHash: "simulated:test" });
  });

  it("loading: shimmer skeleton", async () => {
    useProperty.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() });
    await renderPage(listing.id);
    expect(screen.getByTestId("property-detail-skeleton")).toBeInTheDocument();
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("error: Retry", async () => {
    useProperty.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() });
    await renderPage(listing.id);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("empty: property not found", async () => {
    useProperty.mockReturnValue({ data: undefined, isLoading: false, isError: false, refetch: vi.fn() });
    await renderPage("missing");
    expect(screen.getByText("Property not found")).toBeInTheDocument();
  });

  it("shows Telegram BackButton when property loads", async () => {
    useProperty.mockReturnValue({ data: listing, isLoading: false, isError: false, refetch: vi.fn() });
    await renderPage(listing.id);
    expect(backButton.show).toHaveBeenCalled();
    expect(backButton.onClick).toHaveBeenCalled();
  });

  it("success: detail sections + MainButton Buy Share", async () => {
    useProperty.mockReturnValue({ data: listing, isLoading: false, isError: false, refetch: vi.fn() });
    await renderPage(listing.id);
    expect(screen.getByTestId("property-detail")).toBeInTheDocument();
    expect(mainButton.setParams).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Buy Share" }),
    );
  });

  it("buy happy path: open sheet → continue → confirm → success", async () => {
    useProperty.mockReturnValue({ data: listing, isLoading: false, isError: false, refetch: vi.fn() });
    await renderPage(listing.id);

    await act(async () => {
      await mainHandler?.();
    });
    expect(await screen.findByTestId("buy-qty-step")).toBeInTheDocument();

    await act(async () => {
      await mainHandler?.();
    });
    expect(await screen.findByTestId("buy-summary-step")).toBeInTheDocument();

    await act(async () => {
      await mainHandler?.();
    });
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ propertyId: listing.id, quantity: expect.any(Number) }),
      );
    });
    expect(await screen.findByTestId("buy-success-step")).toBeInTheDocument();
    expect(screen.getByText(/Congratulations/i)).toBeInTheDocument();
  });
});

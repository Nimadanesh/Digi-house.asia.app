import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import type { Listing } from "@/types/property";
import type { ShareLock } from "@/types/lock";
import { YieldLockSection } from "@/components/property/YieldLockSection";

/** Mutable mock state so tests can drive pending / error phases. */
const mutate = vi.fn();
const unlockMock = {
  mutate,
  isPending: false,
  isError: false,
  error: null as Error | null,
  variables: null as string | null,
};

vi.mock("@/lib/telegram/haptics", () => ({
  haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
}));

vi.mock("@/hooks/usePortfolio", () => ({
  usePortfolio: vi.fn(() => ({
    data: {
      holdings: [
        { propertyId: "prop-x", sharesOwned: 10, avgCostUsd: 12_000, currentValueUsd: 120_000, pendingWeekEarningsUsd: 0, shareRatio: 0.01 },
      ],
    },
  })),
}));

vi.mock("@/hooks/useLocks", () => ({
  useLocks: vi.fn(() => ({ data: { locks: [lock] } })),
  useCreateLock: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false, error: null })),
  useRequestUnlock: vi.fn(() => unlockMock),
  useMeSummary: vi.fn(() => ({ data: undefined })),
  activeLocksForProperty: (locks: ShareLock[] | undefined, propertyId: string) =>
    (locks ?? []).filter((l) => l.propertyId === propertyId && l.status !== "matured"),
}));

vi.mock("@/hooks/useSells", () => ({
  useInstantSell: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false, error: null })),
  usePlaceOrder: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false, error: null })),
}));

const listing: Listing = {
  id: "prop-x",
  title: "Villa One",
  location: "Y",
  description: "x",
  images: [],
  totalShares: 1000,
  sharePriceUsd: 12_000,
  status: "funding",
  ownerWalletAddress: "EQAtest",
  annualRentUsd: 500_000,
  createdAt: "2026-01-12T09:00:00Z",
  sharesSold: 100,
  sharesRemaining: 900,
  fundingProgressRatio: 0.1,
  monthlyYieldRate: 6,
  totalValueUsd: 8_000_000,
  meta: {
    sizeSqm: 72,
    yearBuilt: 2019,
    propertyType: "Apartment",
    rentalStatus: "rented",
    leaseUntil: null,
    activeTenant: true,
    tokenizationDocUrl: "#",
  },
  rentalHistory: [],
};

const lock: ShareLock = {
  id: "lock-1",
  propertyId: "prop-x",
  propertyTitle: "Villa One",
  shares: 5,
  principalUsd: 60_000,
  payoutPeriod: "monthly",
  monthlyRate: 6,
  status: "locked",
  lockedAt: "2026-08-01T00:00:00Z",
  unlockRequestedAt: null,
  maturedAt: null,
  nextPayoutAt: "2026-09-01T00:00:00Z",
  maturesAt: null,
  accruedUnpaidUsd: 1_200,
  installmentUsd: 3_600,
  projectedMonthlyUsd: 3_600,
  projectedWeeklyUsd: 850,
};

function openConfirm() {
  fireEvent.click(screen.getByRole("button", { name: /request unlock/i }));
}

describe("YieldLockSection — unlock confirmation flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    unlockMock.isPending = false;
    unlockMock.isError = false;
    unlockMock.error = null;
  });

  it("Request unlock opens the confirmation sheet and does NOT mutate", () => {
    render(<YieldLockSection listing={listing} />);
    openConfirm();
    const sheet = screen.getByTestId("unlock-confirm");
    expect(sheet).toBeInTheDocument();
    expect(screen.getByText("Unlock shares")).toBeInTheDocument();
    // Scope to the sheet: "5" also appears in the page behind it (free-to-lock).
    expect(within(sheet).getByText("Villa One")).toBeInTheDocument();
    expect(within(sheet).getByText("Shares")).toBeInTheDocument();
    expect(within(sheet).getByText("5")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("Cancel closes the sheet without mutating", () => {
    render(<YieldLockSection listing={listing} />);
    openConfirm();
    fireEvent.click(screen.getByTestId("unlock-confirm-cancel"));
    expect(screen.queryByTestId("unlock-confirm")).not.toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("Confirm triggers the existing unlock mutation with the lock id", () => {
    render(<YieldLockSection listing={listing} />);
    openConfirm();
    fireEvent.click(screen.getByTestId("unlock-confirm-confirm"));
    expect(mutate).toHaveBeenCalledWith("lock-1", expect.any(Object));
  });

  it("pending disables confirm (duplicate submission prevented) and shows Unlocking…", () => {
    unlockMock.isPending = true;
    mutate.mockImplementation(() => {});
    render(<YieldLockSection listing={listing} />);
    openConfirm();
    const confirm = screen.getByTestId("unlock-confirm-confirm");
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveTextContent("Unlocking…");
    expect(screen.queryByTestId("unlock-confirm-cancel")).not.toBeInTheDocument();
    fireEvent.click(confirm);
    expect(mutate).not.toHaveBeenCalled();
  });

  it("success shows the completion state with the new sellability, Done closes", () => {
    mutate.mockImplementation((_id: string, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    render(<YieldLockSection listing={listing} />);
    openConfirm();
    fireEvent.click(screen.getByTestId("unlock-confirm-confirm"));
    expect(screen.getByTestId("unlock-confirm-success")).toBeInTheDocument();
    expect(screen.getByText("Unlock requested")).toBeInTheDocument();
    expect(screen.getByText(/sellable in 2–3 days/)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("unlock-confirm-done"));
    expect(screen.queryByTestId("unlock-confirm-success")).not.toBeInTheDocument();
  });

  it("error is shown in context and confirm stays enabled as the retry path", () => {
    unlockMock.isError = true;
    unlockMock.error = new Error("Network hiccup");
    mutate.mockImplementation(() => {});
    render(<YieldLockSection listing={listing} />);
    openConfirm();
    fireEvent.click(screen.getByTestId("unlock-confirm-confirm"));
    const err = screen.getByTestId("unlock-confirm-error");
    expect(err).toHaveTextContent("Network hiccup");
    expect(err).toHaveAttribute("role", "alert");
    expect(screen.getByTestId("unlock-confirm-confirm")).toBeEnabled();
  });
});

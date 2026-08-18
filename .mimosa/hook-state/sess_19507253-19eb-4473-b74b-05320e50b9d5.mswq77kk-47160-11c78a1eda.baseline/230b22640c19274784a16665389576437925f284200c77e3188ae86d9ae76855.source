import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

// Mock useTonConnect BEFORE importing WalletBadge (vi.mock hoists).
vi.mock("@/hooks/useTonConnect", () => ({
  useTonConnect: () => ({
    connected: false,
    address: null,
    short: "",
    network: "testnet",
    openModal: vi.fn(),
  }),
}));

import { WalletBadge } from "@/components/wallet/WalletBadge";

describe("WalletBadge — disconnected state", () => {
  it("renders nothing when the wallet is disconnected", () => {
    const { container } = render(<WalletBadge />);
    expect(container.firstChild).toBeNull();
  });
});
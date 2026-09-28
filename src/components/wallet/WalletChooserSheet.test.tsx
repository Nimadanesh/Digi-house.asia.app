"use client";
// File responsibility tested: featured wallets, search, TON routing, honest Soon states.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WalletChooserSheet } from "@/components/wallet/WalletChooserSheet";

vi.mock("@/lib/telegram/haptics", () => ({
  haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
}));

describe("WalletChooserSheet — agnostic picker", () => {
  const onClose = vi.fn();
  const onPickTon = vi.fn();
  const onPickEvm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function open(extra = {}) {
    render(
      <WalletChooserSheet open onClose={onClose} onPickTon={onPickTon} onPickEvm={onPickEvm} {...extra} />,
    );
  }

  it("shows the title, 5 featured wallets and the searchable list", () => {
    open();
    expect(screen.getByTestId("wallet-chooser")).toBeInTheDocument();
    expect(screen.getByText("Choose a wallet")).toBeInTheDocument();
    for (const id of ["metamask", "trust", "coinbase", "rainbow", "tonkeeper"]) {
      expect(screen.getByTestId(`wallet-featured-${id}`)).toBeInTheDocument();
    }
    expect(screen.getByTestId("wallet-search-input")).toBeInTheDocument();
    expect(screen.getByTestId(`wallet-pick-tonkeeper`)).toBeInTheDocument();
  });

  it("routes TON wallets to the existing flow", () => {
    open();
    fireEvent.click(screen.getByTestId("wallet-pick-tonkeeper"));
    expect(onPickTon).toHaveBeenCalledTimes(1);
    expect(onPickTon.mock.calls[0]?.[0]).toMatchObject({ id: "tonkeeper" });
  });

  it("routes EVM wallets to wagmi when pairing is configured", () => {
    open();
    // No Project ID in test env → pairing unconfigured: inline setup note, no connect.
    fireEvent.click(screen.getByTestId("wallet-pick-metamask"));
    expect(onPickEvm).not.toHaveBeenCalled();
    expect(screen.getByTestId("wallet-soon-metamask")).toHaveTextContent(
      "WalletConnect Project ID",
    );
    expect(screen.getByTestId("wallet-setup-note")).toBeInTheDocument();
  });

  it("non-EVM wallets show Coming soon without calling any flow", () => {
    open();
    fireEvent.click(screen.getByTestId("wallet-pick-phantom"));
    expect(onPickTon).not.toHaveBeenCalled();
    expect(onPickEvm).not.toHaveBeenCalled();
    expect(screen.getByTestId("wallet-soon-phantom")).toHaveTextContent(
      "will be supported soon",
    );
  });

  it("search filters the registry", () => {
    open();
    fireEvent.change(screen.getByTestId("wallet-search-input"), {
      target: { value: "tonkeeper" },
    });
    expect(screen.getByTestId("wallet-pick-tonkeeper")).toBeInTheDocument();
    expect(screen.queryByTestId("wallet-pick-metamask")).not.toBeInTheDocument();
  });

  it("keeps a stable fixed-height layout while typing (no sheet jumps)", () => {
    open();
    const sheet = screen.getByTestId("wallet-chooser");
    const before = sheet.getAttribute("class") ?? "";
    expect(before).toContain("flex-col");
    expect(before).toMatch(/h-\[min\(68svh,540px\)\]/);
    expect(screen.getByTestId("wallet-scroll")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("wallet-search-input"), {
      target: { value: "meta" },
    });
    fireEvent.change(screen.getByTestId("wallet-search-input"), {
      target: { value: "metamask" },
    });
    fireEvent.change(screen.getByTestId("wallet-search-input"), {
      target: { value: "" },
    });
    // Same outer classes throughout — only scroll content changed.
    expect(screen.getByTestId("wallet-chooser").getAttribute("class")).toBe(before);
    expect(screen.getByTestId("wallet-scroll")).toBeInTheDocument();
    expect(screen.getByTestId("wallet-search-input")).toBeInTheDocument();
  });

  it("shows connected accounts with disconnect actions when provided", () => {
    const onDisconnectTon = vi.fn();
    const onDisconnectEvm = vi.fn();
    open({
      tonAccount: { short: "EQab…xyz0" },
      evmAccount: { short: "0x742d…f44e", chain: "Ethereum" },
      onDisconnectTon,
      onDisconnectEvm,
    });
    expect(screen.getByTestId("wallet-connected")).toBeInTheDocument();
    expect(screen.getByTestId("wallet-connected-ton")).toHaveTextContent("EQab…xyz0");
    expect(screen.getByTestId("wallet-connected-evm")).toHaveTextContent("0x742d…f44e");
    fireEvent.click(screen.getByTestId("wallet-disconnect-ton"));
    expect(onDisconnectTon).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("wallet-disconnect-evm"));
    expect(onDisconnectEvm).toHaveBeenCalledTimes(1);
  });

  it("hides the connected section when nothing is connected", () => {
    open();
    expect(screen.queryByTestId("wallet-connected")).not.toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    render(
      <WalletChooserSheet open={false} onClose={onClose} onPickTon={onPickTon} onPickEvm={onPickEvm} />,
    );
    expect(screen.queryByTestId("wallet-chooser")).not.toBeInTheDocument();
  });

  it("shows real brand icons for priority wallets", () => {
    open();
    const metas = screen.getAllByTestId("wallet-icon-metamask");
    const meta = metas[metas.length - 1];
    expect(meta).toHaveAttribute(
      "src",
      expect.stringContaining("explorer-api.walletconnect.com"),
    );
    expect(screen.getAllByTestId("wallet-icon-trust").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("wallet-icon-coinbase").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("wallet-icon-rainbow").length).toBeGreaterThan(0);
    const tk = screen.getAllByTestId("wallet-icon-tonkeeper");
    expect(tk[tk.length - 1]).toHaveAttribute(
      "src",
      expect.stringContaining("tonkeeper.com"),
    );
  });

  it("falls back to the monogram when no verified icon exists", () => {
    open();
    expect(screen.getByTestId("wallet-monogram-guarda")).toHaveTextContent("G");
  });

  it("falls back to the monogram when the brand image fails to load", () => {
    open();
    const imgs = screen.getAllByTestId("wallet-icon-metamask");
    fireEvent.error(imgs[imgs.length - 1]);
    expect(screen.getByTestId("wallet-monogram-metamask")).toBeInTheDocument();
    expect(screen.queryAllByTestId("wallet-icon-metamask")).toHaveLength(0);
  });
});

// Wiring: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID → env → EVM connectors.
// Uses dynamic imports AFTER setting the var because env.ts reads at import time.
import { describe, it, expect, beforeEach, vi } from "vitest";

const TEST_ID = "test-project-id-from-env";

describe("WalletConnect Project ID wiring", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = TEST_ID;
  });

  it("env exposes the configured Project ID", async () => {
    const { env } = await import("@/lib/env");
    expect(env.walletConnectProjectId).toBe(TEST_ID);
  });

  it(
    "pairing is enabled and the walletConnect connector is registered",
    async () => {
      const { canPairEvm, getEvmConfig, __resetEvmConfigForTests } = await import(
        "@/lib/evm/config"
      );
      __resetEvmConfigForTests();
      expect(canPairEvm()).toBe(true);
      const ids = getEvmConfig().connectors.map((c) => c.id);
      expect(ids).toContain("walletConnect");
    },
    // Real WalletConnect core init (relayer) is slow, especially under parallel load.
    90_000,
  );

  it("empty Project ID disables pairing (setup state, no crash)", async () => {
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = "";
    const { canPairEvm, getEvmConfig, __resetEvmConfigForTests } = await import(
      "@/lib/evm/config"
    );
    __resetEvmConfigForTests();
    expect(canPairEvm()).toBe(false);
    const ids = getEvmConfig().connectors.map((c) => c.id);
    expect(ids).not.toContain("walletConnect");
  });
});

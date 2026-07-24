import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

describe("tonApiBase + network flags", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the testnet endpoint when env.network=testnet", async () => {
    vi.stubEnv("NEXT_PUBLIC_TON_NETWORK", "testnet");
    const { tonApiBase, isTestnet, chainId } = await import("@/lib/ton/network");
    expect(tonApiBase()).toBe("https://testnet.tonapi.io");
    expect(isTestnet).toBe(true);
    expect(chainId).toBe(-3);
  });

  it("returns the mainnet endpoint when env.network=mainnet", async () => {
    vi.stubEnv("NEXT_PUBLIC_TON_NETWORK", "mainnet");
    const { tonApiBase, isTestnet, chainId } = await import("@/lib/ton/network");
    expect(tonApiBase()).toBe("https://tonapi.io");
    expect(isTestnet).toBe(false);
    expect(chainId).toBe(-239);
  });

  it("defaults to testnet when the var is absent or garbage", async () => {
    vi.stubEnv("NEXT_PUBLIC_TON_NETWORK", "garbage");
    const { isTestnet } = await import("@/lib/ton/network");
    expect(isTestnet).toBe(true);
  });
});
import { describe, expect, it } from "vitest";
import { buildEarningsPaidMessage } from "./earnings-paid-message.js";

const BASE = {
  amountUsd: 4000, // $40.00
  propertyTitle: "Bayside Marina Penthouse",
  weekOf: "2026-07-20T00:00:00Z",
};

describe("buildEarningsPaidMessage", () => {
  it("returns hybrid/demo message when settlement mode is hybrid", () => {
    const text = buildEarningsPaidMessage({ ...BASE, settlementMode: "hybrid" });
    expect(text).toContain("Demo");
    expect(text).toContain("$40.00");
    expect(text).toContain("Bayside Marina Penthouse");
    expect(text).toContain("2026-07-20");
    expect(text).toContain("simulated");
    expect(text).toContain("not yet on-chain");
    expect(text).not.toContain("recorded");
  });

  it("returns hybrid/demo message when settlement mode is mock", () => {
    const text = buildEarningsPaidMessage({ ...BASE, settlementMode: "mock" });
    expect(text).toContain("Demo");
    expect(text).toContain("simulated");
  });

  it("returns hybrid/demo message when settlement mode is undefined", () => {
    const text = buildEarningsPaidMessage({ ...BASE });
    expect(text).toContain("Demo");
    expect(text).toContain("simulated");
  });

  it("returns onchain message when settlement mode is onchain", () => {
    const text = buildEarningsPaidMessage({ ...BASE, settlementMode: "onchain" });
    expect(text).toContain("Weekly Rental Payout");
    expect(text).not.toContain("Demo");
    expect(text).not.toContain("simulated");
    expect(text).not.toContain("not yet on-chain");
    expect(text).toContain("recorded");
  });

  it("formats $0.00 correctly", () => {
    const text = buildEarningsPaidMessage({
      ...BASE,
      amountUsd: 0,
      settlementMode: "hybrid",
    });
    expect(text).toContain("$0.00");
  });

  it("formats large amounts correctly", () => {
    const text = buildEarningsPaidMessage({
      ...BASE,
      amountUsd: 1234567,
      settlementMode: "hybrid",
    });
    expect(text).toContain("$12345.67");
  });

  it("formats small cents correctly", () => {
    const text = buildEarningsPaidMessage({
      ...BASE,
      amountUsd: 1,
      settlementMode: "hybrid",
    });
    expect(text).toContain("$0.01");
  });

  it("never claims rent landed in wallet for hybrid/mock", () => {
    const text = buildEarningsPaidMessage({ ...BASE, settlementMode: "hybrid" });
    expect(text.toLowerCase()).not.toContain("wallet");
  });

  it("never claims rent landed in wallet for hybrid/mock", () => {
    const text = buildEarningsPaidMessage({ ...BASE, settlementMode: "mock" });
    expect(text.toLowerCase()).not.toContain("wallet");
  });

  it("may reference on-chain in truthful disclaimer (canonical hero copy)", () => {
    const text = buildEarningsPaidMessage({ ...BASE, settlementMode: "hybrid" });
    // ADR-001 §3 canonical hero: "simulated weekly payout · on-chain verifiable post-MVP"
    // The message is allowed to say "not yet on-chain" / "on-chain verifiable post-MVP"
    const lower = text.toLowerCase();
    expect(lower).toContain("on-chain verifiable");
    expect(lower).toContain("post-mvp");
    expect(lower).toContain("simulated");
    expect(lower).not.toContain("rent landed");
  });
});

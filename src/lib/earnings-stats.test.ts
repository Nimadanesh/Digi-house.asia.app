import { describe, it, expect } from "vitest";
import { groupIncomeByEstate } from "./earnings-stats";
import type { EarningsEntry } from "@/types/earnings";

const base: Omit<EarningsEntry, "id" | "weekOf" | "amountUsd" | "status"> = {
  userId: "u1",
  propertyId: "prop-a",
  tonAmount: 0,
  shareRatio: 0.01,
};

describe("groupIncomeByEstate — paid-only totals per property", () => {
  it("sums paid entries per estate in first-appearance order", () => {
    const entries: EarningsEntry[] = [
      { ...base, id: "e1", weekOf: "2026-07-13T00:00:00Z", amountUsd: 1000, status: "paid" },
      { ...base, propertyId: "prop-b", id: "e2", weekOf: "2026-07-13T00:00:00Z", amountUsd: 500, status: "paid" },
      { ...base, id: "e3", weekOf: "2026-07-06T00:00:00Z", amountUsd: 2000, status: "paid" },
    ];
    const grouped = groupIncomeByEstate(entries);
    expect([...grouped.keys()]).toEqual(["prop-a", "prop-b"]);
    expect(grouped.get("prop-a")).toEqual({ receivedUsd: 3000 });
    expect(grouped.get("prop-b")).toEqual({ receivedUsd: 500 });
  });

  it("ignores pending entries — received is paid money only", () => {
    const entries: EarningsEntry[] = [
      { ...base, id: "e1", weekOf: "2026-07-13T00:00:00Z", amountUsd: 1000, status: "paid" },
      { ...base, id: "e2", weekOf: "2026-07-20T00:00:00Z", amountUsd: 9999, status: "pending" },
    ];
    const grouped = groupIncomeByEstate(entries);
    expect(grouped.get("prop-a")).toEqual({ receivedUsd: 1000 });
  });

  it("estates with no paid entries are simply absent — never a fabricated zero", () => {
    const entries: EarningsEntry[] = [
      { ...base, propertyId: "prop-b", id: "e2", weekOf: "2026-07-20T00:00:00Z", amountUsd: 9999, status: "pending" },
    ];
    expect(groupIncomeByEstate(entries).size).toBe(0);
  });
});

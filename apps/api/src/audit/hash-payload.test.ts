import { describe, expect, it } from "vitest";
import { hashAuditPayload } from "./hash-payload.js";

describe("hashAuditPayload", () => {
  it("same object different key order → same hash", () => {
    const a = hashAuditPayload({ b: 2, a: 1, nested: { z: 1, y: 2 } });
    const b = hashAuditPayload({ nested: { y: 2, z: 1 }, a: 1, b: 2 });
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("different payload → different hash", () => {
    const a = hashAuditPayload({ intentId: "x", quantity: 1 });
    const b = hashAuditPayload({ intentId: "x", quantity: 2 });
    expect(a).not.toBe(b);
  });
});

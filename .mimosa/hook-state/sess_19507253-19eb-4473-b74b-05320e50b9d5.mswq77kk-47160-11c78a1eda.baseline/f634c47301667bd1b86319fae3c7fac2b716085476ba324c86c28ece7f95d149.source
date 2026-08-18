import { describe, expect, it } from "vitest";
import {
  bearerTokenFromHeader,
  signSessionToken,
  verifySessionToken,
} from "./session.js";

const cfg = {
  secret: "unit-test-session-secret-32chars!!",
  ttlSeconds: 3600,
};

describe("session JWT", () => {
  it("signs and verifies", async () => {
    const { token, expiresAt } = await signSessionToken("u1", cfg);
    const claims = await verifySessionToken(token, cfg);
    expect(claims?.sub).toBe("u1");
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("rejects wrong secret", async () => {
    const { token } = await signSessionToken("u1", cfg);
    const claims = await verifySessionToken(token, {
      ...cfg,
      secret: "other-secret-other-secret-other!!",
    });
    expect(claims).toBeNull();
  });

  it("parses Bearer header", () => {
    expect(bearerTokenFromHeader("Bearer abc.def")).toBe("abc.def");
    expect(bearerTokenFromHeader(undefined)).toBeNull();
    expect(bearerTokenFromHeader("Basic x")).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { buildCoOwnLink } from "@/lib/coown/co-own-link";

describe("co-own invite link", () => {
  it("builds an estate-scoped link carrying estate + inviter context", () => {
    expect(buildCoOwnLink({ botUsername: "Bot", estateId: "re-1", inviterId: "u1" })).toBe(
      "https://t.me/Bot?startapp=coown_re-1_ref_u1",
    );
  });

  it("returns null instead of a malformed URL", () => {
    expect(buildCoOwnLink({ botUsername: "", estateId: "re-1", inviterId: "u1" })).toBeNull();
    expect(buildCoOwnLink({ botUsername: "Bot", estateId: "", inviterId: "u1" })).toBeNull();
    expect(buildCoOwnLink({ botUsername: "Bot", estateId: "   ", inviterId: "u1" })).toBeNull();
    expect(buildCoOwnLink({ botUsername: "Bot", estateId: "re-1", inviterId: "" })).toBeNull();
  });
});

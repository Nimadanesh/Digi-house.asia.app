import { describe, expect, it } from "vitest";
import { buildNftMetadata, metadataUrlFor } from "./metadata.js";

describe("buildNftMetadata (Phase 4)", () => {
  const input = {
    nftId: "nft_abc123",
    propertyTitle: "Villa A",
    propertyLocation: "Bali, Indonesia",
    sharesOwned: 100,
  };

  it("is deterministic — same inputs produce byte-identical output", () => {
    const a = JSON.stringify(buildNftMetadata(input));
    const b = JSON.stringify(buildNftMetadata(input));
    expect(a).toBe(b);
  });

  it("names the collectible with the brand + property", () => {
    const m = buildNftMetadata(input);
    expect(m.name).toBe("FractionalLuxe — Villa A");
  });

  it("clearly states the NFT is a display-only collectible, not the ownership record", () => {
    const m = buildNftMetadata(input);
    expect(m.description).toContain("display only");
    expect(m.description).toContain("authoritative record of ownership");
    expect(m.description).toContain("database");
  });

  it("attributes carry brand, property, location, shares and the public position reference", () => {
    const attrs = Object.fromEntries(
      buildNftMetadata(input).attributes.map((a) => [a.trait_type, a.value]),
    );
    expect(attrs["Brand"]).toBe("FractionalLuxe");
    expect(attrs["Property"]).toBe("Villa A");
    expect(attrs["Location"]).toBe("Bali, Indonesia");
    expect(attrs["Shares"]).toBe("100");
    expect(attrs["Position"]).toBe("nft_abc123");
  });

  it("exposes NO sensitive personal information", () => {
    const json = JSON.stringify(buildNftMetadata(input));
    // The internal user id never appears — the position reference is the public NFT id.
    expect(json).not.toContain("user");
    expect(json).not.toContain("telegram");
    expect(json).not.toContain("email");
    expect(json).not.toContain("wallet");
    expect(json).not.toContain("private");
  });

  it("metadataUrlFor builds the stable URL structure", () => {
    expect(metadataUrlFor("http://localhost:8787", "nft_abc")).toBe(
      "http://localhost:8787/nft-metadata/nft_abc.json",
    );
    expect(metadataUrlFor("https://api.example.com/", "nft_abc")).toBe(
      "https://api.example.com/nft-metadata/nft_abc.json",
    );
  });
});

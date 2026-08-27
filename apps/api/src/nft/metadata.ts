// File responsibility: deterministic, PII-free off-chain NFT metadata (Phase 4).
// The same inputs always produce the same JSON (pure function). Public metadata must
// never expose Telegram user ids, emails, auth data, private financial figures or keys.
// The "Position" attribute is the public NFT reference (the NFT id) — NOT the internal
// user id or holding_key. Wallets/explorers fetch this via the stable metadata URL.
export type NftMetadataInput = {
  /** Public NFT record id — the public position reference. */
  nftId: string;
  propertyTitle: string;
  propertyLocation: string;
  sharesOwned: number;
};

export type NftMetadata = {
  name: string;
  description: string;
  attributes: Array<{ trait_type: string; value: string }>;
};

export function buildNftMetadata(input: NftMetadataInput): NftMetadata {
  return {
    name: `FractionalLuxe — ${input.propertyTitle}`,
    description:
      "Collectible representation of a FractionalLuxe investment position. " +
      "This NFT is for display only — the FractionalLuxe database remains the " +
      "authoritative record of ownership.",
    attributes: [
      { trait_type: "Brand", value: "FractionalLuxe" },
      { trait_type: "Property", value: input.propertyTitle },
      { trait_type: "Location", value: input.propertyLocation },
      { trait_type: "Shares", value: String(input.sharesOwned) },
      { trait_type: "Position", value: input.nftId },
    ],
  };
}

/** Stable metadata URL for an NFT record (movable to immutable storage later). */
export function metadataUrlFor(
  baseUrl: string,
  nftId: string,
): string {
  const base = baseUrl.replace(/\/+$/, "");
  return `${base}/nft-metadata/${nftId}.json`;
}

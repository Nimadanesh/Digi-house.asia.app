/**
 * Collectible Position NFT (Phase 9). The NFT is a display-only receipt — the database
 * (holdings) remains the 100% source of truth for ownership, yield, trades and balances.
 */
export type NftStatus =
  | "pending"
  | "minting"
  | "minted"
  | "transferring"
  | "delivered"
  | "failed";

export interface HoldingNft {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  sharesOwned: number;
  status: NftStatus;
  /** Delivery wallet snapshot (the wallet verified with the payment). */
  walletAddress: string;
  collectionAddress: string | null;
  nftItemId: number | null;
  nftAddress: string | null;
  metadataUrl: string | null;
  mintTxHash: string | null;
  transferTxHash: string | null;
  attempts: number;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

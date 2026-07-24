export type PropertyStatus = "funding" | "funded" | "resale";

export interface Property {
  id: string;
  title: string;
  location: string;
  description: string;
  images: string[];
  totalShares: number;
  sharePriceUsd: number;   // minor units
  status: PropertyStatus;
  ownerWalletAddress: string;
  annualRentUsd: number;   // minor units
  createdAt: string;
}

export interface Listing extends Property {
  sharesSold: number;
  sharesRemaining: number;
  fundingProgressRatio: number; // 0..1
}
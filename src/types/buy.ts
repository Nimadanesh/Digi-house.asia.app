// File responsibility: buy-intent payload contracts shared across repos/hooks (near-leaf).
// Mirrors POST /v1/buys/prepare + /v1/buys/confirm responses.

/** Payment rail selected at prepare: native TON or the USDT (Jetton) rail. */
export type BuyCurrency = "TON" | "USDT";

/** The TonConnect message returned by prepare (backend tonConnectMessages[0]) — send it verbatim. */
export interface BuyTonConnectMessage {
  /** Destination address: admin receive wallet for TON; the BUYER's USDT jetton wallet for USDT. */
  address: string;
  /** Message value in nanoTON (native transfer amount for TON; 0.1 TON gas for the USDT jetton transfer). */
  amount: string;
  /** jetton_transfer body as base64 BoC for USDT; null for native TON (memo is used instead). */
  payload?: string | null;
}

export interface BuyPrepareResult {
  intentId: string;
  propertyId: string;
  quantity: number;
  priceUsdPerShare: number;
  /** Principal (quantity × share price), integer cents. */
  totalUsd: number;
  /** Primary-market commission (FractionalLuxe revenue), integer cents; set by the API/mock. */
  feeUsd?: number;
  /** Principal + commission — what the buyer actually pays. */
  totalPayableUsd?: number;
  /** Payment rail chosen at prepare — drives display + verification expectations. */
  currency: BuyCurrency;
  /** The exact TonConnect message to send (backend tonConnectMessages[0]). */
  message: BuyTonConnectMessage;
  expiresAt: string;
}

export interface BuyConfirmResult {
  intentId: string;
  status: "pending" | "confirmed" | "expired" | "cancelled";
  message?: string;
}

export type BuyVerifyStatus = "pending_confirmation" | "verification_failed" | "settled";

export interface BuyVerifyResult {
  intentId: string;
  status: BuyVerifyStatus;
  /** Machine-readable reason when not settled (tx_not_found / api_unavailable are retryable). */
  reason?: string;
  txHash?: string;
  /** Verified value for native-TON payments. */
  actualAmountNano?: string;
  /** Verified value for USDT (Jetton) payments, in base units. */
  actualJettonAmount?: string;
}

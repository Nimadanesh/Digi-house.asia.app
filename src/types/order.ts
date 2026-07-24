export type OrderSide = "buy" | "sell";
export type OrderStatus = "open" | "filled" | "cancelled" | "rejected";

export interface Order {
  id: string;
  propertyId: string;
  makerAddress: string;
  side: OrderSide;
  priceUsd: number;   // minor units per share
  quantity: number;
  filledQuantity: number;
  status: OrderStatus;
  createdAt: string;
}

export interface OrderBookLevel {
  priceUsd: number;
  quantity: number;
  cumulative: number;
}

export interface OrderBookState {
  propertyId: string;
  bids: OrderBookLevel[];   // DESC by price
  asks: OrderBookLevel[];   // ASC by price
  bestBidUsd?: number;
  bestAskUsd?: number;
  lastTradeUsd?: number;
}
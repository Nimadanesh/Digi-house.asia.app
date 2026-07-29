export type OrderSide = "buy" | "sell";
export type OrderStatus = "open" | "filled" | "cancelled" | "rejected";

export type OrderRecord = {
  id: string;
  userId: string;
  propertyId: string;
  makerAddress: string;
  side: OrderSide;
  priceUsd: number;
  quantity: number;
  filledQuantity: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
};

/** Public Order JSON — matches Mini App `Order` / OpenAPI. */
export type OrderPublic = {
  id: string;
  propertyId: string;
  makerAddress: string;
  side: OrderSide;
  priceUsd: number;
  quantity: number;
  filledQuantity: number;
  status: OrderStatus;
  createdAt: string;
};

export function mapOrderRecord(row: OrderRecord): OrderPublic {
  return {
    id: row.id,
    propertyId: row.propertyId,
    makerAddress: row.makerAddress,
    side: row.side,
    priceUsd: Number(row.priceUsd),
    quantity: row.quantity,
    filledQuantity: row.filledQuantity,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

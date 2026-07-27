// File responsibility: open secondary-market orders section on Portfolio (seed demo readiness).
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { usd } from "@/lib/format";
import type { Order } from "@/types/order";

export function OpenOrdersBlock({
  orders,
  nameById,
}: {
  orders: Order[];
  nameById: Record<string, string>;
}) {
  if (orders.length === 0) return null;
  return (
    <section className="space-y-2" data-testid="open-orders">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">Open Orders</h2>
      <Block>
        {orders.map((o) => (
          <Row key={o.id} className="!min-h-[56px]">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">
                {nameById[o.propertyId] ?? o.propertyId}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {o.side} · {o.quantity} shares
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-sm font-semibold tnum text-foreground">{usd(o.priceUsd)}</div>
              <div className="text-[0.6875rem] uppercase tracking-wide text-warning">Open</div>
            </div>
          </Row>
        ))}
      </Block>
    </section>
  );
}

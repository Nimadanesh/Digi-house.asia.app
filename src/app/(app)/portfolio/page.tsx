"use client";
// File responsibility: Portfolio screen — summary block + my-position blocks + open orders, all 4 states.
import Link from "next/link";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useMarketplace } from "@/hooks/useMarketplace";
import { ROUTES } from "@/lib/constants";
import { usd, shortAddr } from "@/lib/format";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { Skeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/common/StatusPill";
import { MyPositionBlock } from "@/components/portfolio/MyPositionBlock";
import type { Order } from "@/types/order";

export default function PortfolioPage() {
  const portfolio = usePortfolio();
  const marketplace = useMarketplace();

  const properties = marketplace.data ?? [];
  const propertyNameById: Record<string, string> = Object.fromEntries(
    properties.map((p) => [p.id, p.title]),
  );

  if (portfolio.isLoading) {
    return (
      <div className="mt-3 space-y-3">
        <Block>
          {Array.from({ length: 4 }).map((_, i) => (
            <Row key={i}>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="ml-auto h-4 w-24" />
            </Row>
          ))}
        </Block>
        {Array.from({ length: 2 }).map((_, i) => (
          <Block key={i}>
            {Array.from({ length: 5 }).map((_, j) => (
              <Row key={j}>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="ml-auto h-4 w-24" />
              </Row>
            ))}
          </Block>
        ))}
      </div>
    );
  }

  if (portfolio.isError) {
    return (
      <Block className="mt-3 p-4 text-center">
        <p className="text-sm text-muted-foreground mb-3">Couldn&apos;t load your portfolio.</p>
        <Button onClick={() => portfolio.refetch()}>Retry</Button>
      </Block>
    );
  }

  const data = portfolio.data;
  if (!data || data.holdings.length === 0) {
    return (
      <EmptyState
        title="No holdings yet"
        message="Buy a slice of a property to see your position here."
        action={
          <Link
            href={ROUTES.marketplace}
            className="inline-flex items-center justify-center h-[44px] rounded-[10px] bg-primary text-primary-foreground px-4 text-sm font-semibold"
          >
            Explore Marketplace
          </Link>
        }
        className="mt-12"
      />
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Summary block */}
      <Block>
        <Row>
          <span className="text-sm text-muted-foreground">Total value</span>
          <span className="ml-auto text-sm tnum text-foreground font-semibold">{usd(data.totalValueUsd)}</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">Total invested</span>
          <span className="ml-auto text-sm tnum text-foreground">{usd(data.totalInvestedUsd)}</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">Total earnings</span>
          <span className="ml-auto text-sm tnum text-success font-medium">{usd(data.totalEarningsUsd)}</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">Next payout</span>
          <span className="ml-auto text-sm tnum text-foreground">{usd(data.weeklyProjectedUsd)}</span>
        </Row>
      </Block>

      {/* My positions — one MyPositionBlock per holding. */}
      {data.holdings.map((h) => (
        <MyPositionBlock
          key={h.propertyId}
          holding={h}
          propertyName={propertyNameById[h.propertyId] ?? h.propertyId}
        />
      ))}

      {/* Open orders — only when the user has any. */}
      {data.openOrders.length > 0 ? (
        <Block>
          <Row>
            <span className="text-sm font-semibold text-foreground">Open orders</span>
          </Row>
          {data.openOrders.map((o) => (
            <OpenOrderRow key={o.id} order={o} propertyName={propertyNameById[o.propertyId] ?? o.propertyId} />
          ))}
        </Block>
      ) : null}
    </div>
  );
}

// Local helper — one open-order row. Lives in the page (composition is the page's single responsibility);
// no lib/mock import; propertyName is passed in by the page's lookup map.
function OpenOrderRow({ order, propertyName }: { order: Order; propertyName: string }) {
  return (
    <Row>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{propertyName}</div>
        <div className="text-xs text-muted-foreground tnum">
          {order.side === "sell" ? "Sell" : "Buy"} · {order.quantity} shares · {usd(order.priceUsd)}/sh · {shortAddr(order.makerAddress)}
        </div>
      </div>
      <StatusPill label={order.status === "open" ? "Open" : "Closed"} variant={order.status === "open" ? "warning" : "danger"} />
    </Row>
  );
}
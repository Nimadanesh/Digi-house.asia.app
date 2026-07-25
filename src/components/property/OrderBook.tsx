// File responsibility: read-only order book. DESIGN_SYSTEM §"Order book". Static; no entrance animation.
// All money routed through format.usd (no raw toFixed in components — ownership guard).
import { Block } from "@/components/common/Block";
import { usd } from "@/lib/format";
import type { OrderBookState } from "@/types/order";

export function OrderBook({ state }: { state: OrderBookState }) {
  return (
    <Block className="overflow-hidden">
      <div className="px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground flex justify-between">
        <span>Bids</span><span>Asks</span>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4 pb-4 text-xs font-mono">
        <OrderColumn levels={state.bids} tint="text-success" />
        <OrderColumn levels={state.asks} tint="text-danger" rightAlign />
      </div>
    </Block>
  );
}

function OrderColumn({ levels, tint, rightAlign }: { levels: OrderBookState["bids"]; tint: string; rightAlign?: boolean }) {
  if (levels.length === 0) {
    return <div className={rightAlign ? "text-right text-muted-foreground py-2" : "text-muted-foreground py-2"}>—</div>;
  }
  const best = levels[0];
  return (
    <div className={rightAlign ? "text-right" : ""}>
      {levels.map((lvl, i) => (
        <div key={i} className={`flex ${rightAlign ? "justify-end" : "justify-start"} gap-3 tnum ${i === 0 ? "bg-accent/40 -mx-1 px-1 rounded" : ""}`}>
          <span className={`tnum ${i === 0 ? tint : "text-muted-foreground"}`}>{usd(lvl.priceUsd)}</span>
          <span className="tnum text-muted-foreground">{lvl.quantity}</span>
        </div>
      ))}
      <div className="mt-1 text-xs text-muted-foreground tnum">best {usd(best.priceUsd)}</div>
    </div>
  );
}
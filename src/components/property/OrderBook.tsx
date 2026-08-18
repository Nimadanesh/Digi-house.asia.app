// File responsibility: read-only order book. DESIGN_SYSTEM §"Order book": columns Price / Qty / Cumulative,
// right-aligned font-mono tabular-nums; Bids tinted --success, Asks --danger; best row bg --accent.
// PD-06: depth bars (bg-success/10 / bg-danger/10) behind each level + a "Last" price header.
// Static; no entrance animation. All money routed through format.usd (no raw toFixed — ownership guard).
import { Block } from "@/components/common/Block";
import { SectionLabel } from "@/components/common/SectionLabel";
import { usd } from "@/lib/format";
import type { OrderBookState, OrderBookLevel } from "@/types/order";

export function OrderBook({ state }: { state: OrderBookState }) {
  return (
    <Block className="overflow-hidden">
      <div className="px-4 py-2">
        <SectionLabel>Order book</SectionLabel>
      </div>
      <div className="grid grid-cols-2 pb-3 text-xs font-mono">
        <ColumnHeader label="Bids" tint="text-success" />
        <ColumnHeader label="Asks" tint="text-danger" />
      </div>
      {state.lastTradeUsd ? (
        <div
          className="flex items-center justify-center gap-1.5 border-t border-border py-2 text-xs font-mono tnum"
          data-testid="book-last-price"
        >
          <span className="uppercase tracking-wide text-muted-foreground text-[0.625rem] font-medium">Last</span>
          <span className="font-semibold text-foreground">{usd(state.lastTradeUsd)}</span>
        </div>
      ) : null}
      <div className="grid grid-cols-2 px-4 pb-4 text-xs font-mono">
        <OrderColumn levels={state.bids} tint="text-success" />
        <OrderColumn levels={state.asks} tint="text-danger" rightAlign />
      </div>
    </Block>
  );
}

function ColumnHeader({ label, tint }: { label: string; tint: string }) {
  return (
    <div className="px-4 pb-1 flex items-center justify-between">
      <SectionLabel>{label}</SectionLabel>
      <span className={`text-[0.625rem] font-medium uppercase tracking-wide ${tint} opacity-70`}>best</span>
    </div>
  );
}

function OrderColumn({ levels, tint, rightAlign }: { levels: OrderBookLevel[]; tint: string; rightAlign?: boolean }) {
  if (levels.length === 0) {
    return <div className={rightAlign ? "text-right text-muted-foreground py-2" : "text-muted-foreground py-2"}>—</div>;
  }
  const maxCumulative = levels[levels.length - 1]!.cumulative;
  return (
    <div className={rightAlign ? "text-right" : ""}>
      {levels.map((lvl, i) => {
        const depthPct = maxCumulative > 0 ? Math.round((lvl.cumulative / maxCumulative) * 100) : 0;
        return (
          <div
            key={i}
            className={`relative flex ${rightAlign ? "flex-row-reverse" : "flex-row"} gap-3 tnum py-1 border-t border-border first:border-t-0 ${i === 0 ? "bg-accent -mx-4 px-4" : ""}`}
          >
            <div
              aria-hidden
              className={`absolute inset-y-0 ${rightAlign ? "right-0" : "left-0"} ${tint === "text-success" ? "bg-success/10" : "bg-danger/10"}`}
              style={{ width: `${depthPct}%` }}
              data-testid="depth-bar"
            />
            <span className={`relative min-w-[58px] ${i === 0 ? tint : "text-muted-foreground"}`}>{usd(lvl.priceUsd)}</span>
            <span className={`relative min-w-[28px] text-right ${i === 0 ? tint : "text-muted-foreground"}`}>{lvl.quantity}</span>
            <span className={`relative min-w-[40px] text-right text-muted-foreground`}>{lvl.cumulative}</span>
          </div>
        );
      })}
    </div>
  );
}
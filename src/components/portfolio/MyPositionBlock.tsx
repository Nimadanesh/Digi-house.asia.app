"use client";
// File responsibility: one holding's detailed my-position block. DESIGN_SYSTEM §"My-position block":
// rows for Shares owned / Avg cost / Current value / Unrealized PnL. PnL colored --success/--danger
// with an arrow glyph, tabular. Property name is passed in (page builds the lookup) — no lib/mock imports.
import { ArrowUp, ArrowDown } from "lucide-react";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { usd } from "@/lib/format";
import type { Holding } from "@/types/position";

export function MyPositionBlock({ holding, propertyName }: { holding: Holding; propertyName: string }) {
  const investedUsd = holding.avgCostUsd * holding.sharesOwned;
  const pnlUsd = holding.currentValueUsd - investedUsd;
  const up = pnlUsd >= 0;
  return (
    <Block>
      <Row>
        <span className="text-sm font-semibold text-foreground truncate">{propertyName}</span>
      </Row>
      <Row>
        <span className="text-sm text-muted-foreground">Shares owned</span>
        <span className="ml-auto text-sm tnum text-foreground">{holding.sharesOwned}</span>
      </Row>
      <Row>
        <span className="text-sm text-muted-foreground">Avg cost / share</span>
        <span className="ml-auto text-sm tnum text-foreground">{usd(holding.avgCostUsd)}</span>
      </Row>
      <Row>
        <span className="text-sm text-muted-foreground">Current value</span>
        <span className="ml-auto text-sm tnum text-foreground">{usd(holding.currentValueUsd)}</span>
      </Row>
      <Row>
        <span className="text-sm text-muted-foreground">Unrealized PnL</span>
        <span className={`ml-auto inline-flex items-center gap-1 text-sm tnum font-medium ${up ? "text-success" : "text-danger"}`}>
          {up ? <ArrowUp size={16} strokeWidth={1.75} aria-hidden /> : <ArrowDown size={16} strokeWidth={1.75} aria-hidden />}
          {up ? "+" : "−"}{usd(Math.abs(pnlUsd))}
        </span>
      </Row>
    </Block>
  );
}
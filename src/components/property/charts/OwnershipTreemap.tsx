"use client";
// File responsibility: Ownership Treemap (REDESIGN-SPEC §12.3) — relative
// ownership as a slice-and-dice treemap of anonymized holder buckets, with
// in-rect labels and a tap tooltip. Consumes ONLY the Phase 4 shared holder
// dataset; mobile-first full-width, no PII.
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { HolderBucket } from "@/lib/property-analytics";
import { HOLDER_COLORS } from "./shared";

const W = 440;
const H = 220;

interface Rect {
  key: string;
  shares: number;
  bps: number;
  x: number;
  y: number;
  w: number;
  h: number;
  style: { fill: string; fillOpacity: number };
}

/**
 * Slice-and-dice treemap: alternate horizontal/vertical splits, each bucket
 * taking a rectangle proportional to its share of the total.
 */
function layout(buckets: { key: string; shares: number; bps: number; style: { fill: string; fillOpacity: number } }[]): Rect[] {
  const totalBps = buckets.reduce((s, b) => s + b.bps, 0) || 1;
  const rects: Rect[] = [];
  let offset = 0; // 0..1 position along the current split axis
  let horiz = true; // alternate split direction each level
  let x0 = 0;
  let y0 = 0;
  let availW = W;
  let availH = H;

  for (let i = 0; i < buckets.length; i++) {
    const frac = buckets[i].bps / totalBps;
    const remainingFrac = 1 - offset;
    if (horiz) {
      const w = availW * (frac / remainingFrac);
      rects.push({ ...buckets[i], x: x0, y: y0, w, h: availH });
      x0 += w;
      availW -= w;
    } else {
      const h = availH * (frac / remainingFrac);
      rects.push({ ...buckets[i], x: x0, y: y0, w: availW, h });
      y0 += h;
      availH -= h;
    }
    offset += frac;
    // Alternate axis each level; reset offset at each alternation.
    if (i < buckets.length - 1) {
      horiz = !horiz;
      offset = 0;
    }
  }
  return rects;
}

export function OwnershipTreemap({
  holders,
}: {
  holders: HolderBucket[];
  /** Destructured out — rect areas already derive from each bucket's
   * weightBps share of totalShares, so the raw total is unused here. */
  totalShares: number;
}) {
  const t = useTranslations("property");
  const [sel, setSel] = useState<string | null>(null);

  const buckets = holders.map((h, i) => ({
    key: h.label,
    shares: h.shares,
    bps: h.weightBps,
    style: HOLDER_COLORS[i] ?? HOLDER_COLORS[HOLDER_COLORS.length - 1],
  }));

  const rects = layout(buckets);
  const selRect = rects.find((r) => r.key === sel);

  return (
    <div className="space-y-3" data-testid="ownership-treemap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={t("treemapTitle")}
        data-testid="treemap-svg"
      >
        {rects.map((r) => {
          const selected = sel === r.key;
          const showLabel = r.w > 52 && r.h > 34;
          return (
            <g
              key={r.key}
              onPointerEnter={() => setSel(r.key)}
              onPointerDown={() => setSel(r.key)}
              data-testid={`treemap-cell-${r.key.replace("holder.", "")}`}
            >
              <rect
                x={r.x + 1}
                y={r.y + 1}
                width={Math.max(0, r.w - 2)}
                height={Math.max(0, r.h - 2)}
                rx={6}
                fill={r.style.fill}
                fillOpacity={selected ? r.style.fillOpacity : r.style.fillOpacity * 0.8}
                stroke="var(--color-card)"
                strokeWidth="2"
              />
              {showLabel ? (
                <>
                  <text
                    x={r.x + 8}
                    y={r.y + 18}
                    fontSize="11"
                    fontWeight="600"
                    fill="var(--color-primary-foreground)"
                  >
                    {t(r.key)}
                  </text>
                  <text
                    x={r.x + 8}
                    y={r.y + 32}
                    fontSize="10"
                    fill="var(--color-primary-foreground)"
                    opacity="0.85"
                  >
                    <tspan className="tnum">{((r.bps / 100)).toFixed(1)}%</tspan>
                  </text>
                </>
              ) : null}
            </g>
          );
        })}
      </svg>

      <div
        className="min-h-[3.25rem] rounded-[10px] bg-surface-2 px-3 py-2 text-center text-xs leading-relaxed text-foreground"
        data-testid="treemap-tooltip"
      >
        {selRect ? (
          <>
            <span className="font-semibold">{t(selRect.key)}</span>
            {" · "}
            <span className="tnum">{selRect.shares.toLocaleString()}</span> {t("sharesWord")} ·{" "}
            <span className="tnum">{(selRect.bps / 100).toFixed(1)}%</span>
          </>
        ) : (
          t("treemapTapHint")
        )}
      </div>
    </div>
  );
}

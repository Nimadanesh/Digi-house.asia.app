"use client";
// File responsibility: Token Holder Distribution donut chart (REDESIGN-SPEC §12.1)
// — top holder buckets + Others, center shows Total Holders, tap tooltips with
// category, token count and percentage. Consumes ONLY the Phase 4 shared holder
// dataset (lib/property-analytics); no chart-local random data, no PII.
import { useRef } from "react";
import { useTranslations } from "next-intl";
import type { HolderBucket } from "@/lib/property-analytics";
import { HOLDER_COLORS, OTHERS_COLOR, TAP_SLOP_PX, useChartSelection } from "./shared";

const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUT = 96;
const R_IN = 62;

/** Donut arc segment path. Angles in radians, 0 = 12 o'clock, clockwise. */
function arcPath(a0: number, a1: number, rOut: number, rIn: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const p = (r: number, a: number) =>
    `${(CX + r * Math.sin(a)).toFixed(2)} ${(CY - r * Math.cos(a)).toFixed(2)}`;
  return [
    `M ${p(rOut, a0)}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${p(rOut, a1)}`,
    `L ${p(rIn, a1)}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${p(rIn, a0)}`,
    "Z",
  ].join(" ");
}

export function HolderDonut({
  holders,
  holderCount,
}: {
  holders: HolderBucket[];
  /** Destructured out — the donut's bps weights already encode each bucket's
   * share of totalShares, so the raw total is intentionally unused here. */
  totalShares: number;
  holderCount: number;
}) {
  const t = useTranslations("property");
  // Split interaction: transient mouse hover + persistent touch-tap selection.
  // Taps survive finger lift; re-tapping the segment toggles it off.
  const selection = useChartSelection<number>();
  // Tap origin for svg-level nearest-segment resolution (touch only).
  const svgDownPos = useRef<{ x: number; y: number } | null>(null);

  // Top 5 buckets + one "Others" bucket absorbing the remainder.
  const TOP = 5;
  const top = holders.slice(0, TOP);
  const others = holders.slice(TOP);
  const othersShares = others.reduce((s, h) => s + h.shares, 0);
  const othersBps = others.reduce((s, h) => s + h.weightBps, 0);

  const segments = [
    ...top.map((h, i) => ({
      key: h.label,
      shares: h.shares,
      bps: h.weightBps,
      style: HOLDER_COLORS[i] ?? HOLDER_COLORS[HOLDER_COLORS.length - 1],
    })),
    ...(othersShares > 0
      ? [{ key: "holder.others", shares: othersShares, bps: othersBps, style: OTHERS_COLOR }]
      : []),
  ];

  const totalBps = segments.reduce((s, seg) => s + seg.bps, 0) || 1;
  let acc = 0;
  const arcs = segments.map((seg) => {
    const a0 = (acc / totalBps) * Math.PI * 2;
    acc += seg.bps;
    const a1 = (acc / totalBps) * Math.PI * 2;
    return { ...seg, a0, a1 };
  });

  const sel = selection.active;
  const selSeg = sel != null ? segments[sel] : null;

  // Angle (radians, 0 = 12 o'clock clockwise — the arcPath convention) of a
  // tap relative to the donut center; resolves nearby taps to the nearest
  // segment so thin arcs stay finger-friendly without visual changes.
  function segmentAtPoint(clientX: number, clientY: number, svg: SVGSVGElement): number | null {
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 || arcs.length === 0) return null;
    const x = ((clientX - rect.left) / rect.width) * SIZE - CX;
    const y = ((clientY - rect.top) / rect.height) * SIZE - CY;
    let a = Math.atan2(x, -y);
    if (a < 0) a += Math.PI * 2;
    for (let i = 0; i < arcs.length; i++) {
      if (a >= arcs[i].a0 && (a < arcs[i].a1 || i === arcs.length - 1)) return i;
    }
    return arcs.length - 1;
  }

  return (
    <div className="flex flex-col items-center gap-3" data-testid="holder-donut">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[260px]"
        role="img"
        aria-label={t("holderDonutTitle")}
        data-testid="holder-donut-svg"
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") return;
          svgDownPos.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          if (e.pointerType === "mouse" || svgDownPos.current == null) return;
          const dx = e.clientX - svgDownPos.current.x;
          const dy = e.clientY - svgDownPos.current.y;
          svgDownPos.current = null;
          if (Math.hypot(dx, dy) > TAP_SLOP_PX) return;
          // Taps that already landed on a segment are handled by that
          // segment's own toggle — only resolve background/hole taps here.
          if ((e.target as Element | null)?.closest?.("[data-seg]")) return;
          const idx = segmentAtPoint(e.clientX, e.clientY, e.currentTarget);
          if (idx != null) selection.toggle(idx);
        }}
      >
        {arcs.map((arc, i) => (
          <g key={arc.key}>
            {/* Invisible finger halo — the visible arc keeps its exact geometry;
                taps near a thin segment still resolve to it. Halos render under
                the visible arcs so painted areas always win hit-testing. */}
            <path
              d={arcPath(arc.a0, arc.a1, R_OUT, R_IN)}
              fill="none"
              strokeWidth={24}
              pointerEvents="stroke"
              data-seg={i}
              aria-hidden
              {...selection.hoverHandlers(i)}
              {...selection.tapHandlers(i)}
            />
            <path
              d={arcPath(arc.a0, arc.a1, R_OUT, R_IN)}
              fill={arc.style.fill}
              fillOpacity={sel === null ? arc.style.fillOpacity : sel === i ? arc.style.fillOpacity : arc.style.fillOpacity * 0.45}
              stroke="var(--color-card)"
              strokeWidth="2"
              data-seg={i}
              {...selection.hoverHandlers(i)}
              {...selection.tapHandlers(i)}
              data-testid={`donut-seg-${i}`}
            />
          </g>
        ))}
        {/* Center: Total Holders (spec §12.1) */}
        <text
          x={CX}
          y={CY - 6}
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill="currentColor"
          className="text-foreground tnum"
          data-testid="donut-center-count"
        >
          {holderCount}
        </text>
        <text
          x={CX}
          y={CY + 14}
          textAnchor="middle"
          fontSize="9"
          fill="currentColor"
          className="text-muted-foreground"
        >
          {t("totalHolders")}
        </text>
      </svg>

      {/* Tap tooltip: selected segment (works through touch, spec §22) */}
      <div
        className="min-h-[3.25rem] rounded-[10px] bg-surface-2 px-3 py-2 text-center text-xs leading-relaxed text-foreground"
        data-testid="donut-tooltip"
        aria-live="polite"
      >
        {selSeg ? (
          <>
            <span className="font-semibold">{t(selSeg.key)}</span>
            {" · "}
            <span className="tnum">{selSeg.shares.toLocaleString()}</span>{" "}
            {t("sharesWord")} ·{" "}
            <span className="tnum">{(selSeg.bps / 100).toFixed(1)}%</span>
          </>
        ) : (
          t("donutTapHint")
        )}
      </div>
    </div>
  );
}

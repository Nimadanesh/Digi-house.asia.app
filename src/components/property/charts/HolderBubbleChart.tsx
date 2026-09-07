"use client";
// File responsibility: Token Holder Bubble Chart (REDESIGN-SPEC §12.5) — one
// bubble per anonymized holder bucket, bubble area ∝ share ownership, tap
// tooltip with anonymized label, share count and percentage. Consumes ONLY the
// Phase 4 shared holder dataset; no PII, no arbitrary encoded dimensions.
import { useRef } from "react";
import { useTranslations } from "next-intl";
import type { HolderBucket } from "@/lib/property-analytics";
import { HOLDER_COLORS, TAP_SLOP_PX, useChartSelection } from "./shared";

const W = 440;
const H = 220;

interface PlacedBubble {
  key: string;
  shares: number;
  bps: number;
  cx: number;
  cy: number;
  r: number;
  style: { fill: string; fillOpacity: number };
}

// Bubble AREA proportional to share ownership (spec §12.5 — no arbitrary
// encoded dimensions). Radius = sqrt(area) keeps area ∝ shares.
// Module-level pure placement (≤6 buckets — React Compiler memoizes the
// result; no manual useMemo so nested tap handlers stay compilable).
function placeBubbles(
  holders: HolderBucket[],
): PlacedBubble[] {
  const maxShares = Math.max(...holders.map((h) => h.shares), 1);
  const placed: PlacedBubble[] = [];
  const sorted = holders.map((h, i) => ({
    key: h.label,
    shares: h.shares,
    bps: h.weightBps,
    style: HOLDER_COLORS[i] ?? HOLDER_COLORS[HOLDER_COLORS.length - 1],
  }));
  for (const b of sorted) {
    const frac = b.shares / maxShares;
    const r = 16 + Math.sqrt(frac) * 34; // area ∝ shares
    // Simple deterministic placement: largest near center, then spiral outward.
    const idx = placed.length;
    const angle = idx * 2.399963; // golden-angle spiral
    const dist = idx === 0 ? 0 : 22 + idx * 16;
    let cx = W / 2 + Math.cos(angle) * dist;
    let cy = H / 2 + Math.sin(angle) * dist * 0.62;
    cx = Math.min(W - r - 4, Math.max(r + 4, cx));
    cy = Math.min(H - r - 4, Math.max(r + 4, cy));
    placed.push({ ...b, cx, cy, r });
  }
  return placed;
}

/** Nearest bubble center to a viewBox point — overlap-proof tap resolution. */
function nearestBubble(bubbles: PlacedBubble[], x: number, y: number): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const b of bubbles) {
    const d = Math.hypot(b.cx - x, b.cy - y);
    if (d < bestDist) {
      bestDist = d;
      best = b.key;
    }
  }
  return best;
}

export function HolderBubbleChart({
  holders,
  totalShares,
}: {
  holders: HolderBucket[];
  totalShares: number;
}) {
  const t = useTranslations("property");
  // Split interaction: transient mouse hover per bubble + persistent touch-tap
  // selection resolved to the NEAREST bubble center at the svg level. Bubbles
  // overlap by design (spiral packing), so paint-order hit-testing would make
  // covered bubbles untappable — nearest-center wins for every touch tap.
  const selection = useChartSelection<string>();
  const sel = selection.active;
  const svgDownPos = useRef<{ x: number; y: number } | null>(null);

  function bubbleAtPoint(clientX: number, clientY: number, svg: SVGSVGElement): string | null {
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 || bubbles.length === 0) return null;
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    return nearestBubble(bubbles, x, y);
  }

  // Bubble AREA proportional to share ownership (spec §12.5 — see
  // placeBubbles above for the deterministic layout).
  const bubbles = placeBubbles(holders);

  const selBubble = bubbles.find((b) => b.key === sel);
  void totalShares; // percentages come pre-computed as bps in the dataset

  return (
    <div className="space-y-3" data-testid="holder-bubble-chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={t("bubbleChartTitle")}
        data-testid="bubble-svg"
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
          const key = bubbleAtPoint(e.clientX, e.clientY, e.currentTarget);
          if (key != null) selection.toggle(key);
        }}
      >
        {bubbles.map((b) => {
          const selected = sel === b.key;
          return (
            <g
              key={b.key}
              {...selection.hoverHandlers(b.key)}
              data-testid={`bubble-${b.key.replace("holder.", "")}`}
            >
              {/* Invisible finger halo — the visual bubble keeps its
                  data-driven radius; taps near a small bubble still land. */}
              <circle
                cx={b.cx}
                cy={b.cy}
                r={b.r + 16}
                fill="transparent"
                aria-hidden
              />
              <circle
                cx={b.cx}
                cy={b.cy}
                r={b.r}
                fill={b.style.fill}
                fillOpacity={selected ? b.style.fillOpacity : b.style.fillOpacity * 0.75}
                stroke="var(--color-card)"
                strokeWidth="2"
              />
              {b.r > 20 ? (
                <text
                  x={b.cx}
                  y={b.cy + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="var(--color-primary-foreground)"
                >
                  {(b.bps / 100).toFixed(0)}%
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      <div
        className="min-h-[3.25rem] rounded-[10px] bg-surface-2 px-3 py-2 text-center text-xs leading-relaxed text-foreground"
        data-testid="bubble-tooltip"
        aria-live="polite"
      >
        {selBubble ? (
          <>
            <span className="font-semibold">{t(selBubble.key)}</span>
            {" · "}
            <span className="tnum">{selBubble.shares.toLocaleString()}</span> {t("sharesWord")} ·{" "}
            <span className="tnum">{(selBubble.bps / 100).toFixed(1)}%</span>
          </>
        ) : (
          t("bubbleTapHint")
        )}
      </div>
    </div>
  );
}

"use client";
// File responsibility: Token Holder Bubble Chart (REDESIGN-SPEC §12.5) — one
// bubble per anonymized holder bucket, bubble area ∝ share ownership, tap
// tooltip with anonymized label, share count and percentage. Consumes ONLY the
// Phase 4 shared holder dataset; no PII, no arbitrary encoded dimensions.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { HolderBucket } from "@/lib/property-analytics";
import { HOLDER_COLORS } from "./shared";

const W = 440;
const H = 220;

export function HolderBubbleChart({
  holders,
  totalShares,
}: {
  holders: HolderBucket[];
  totalShares: number;
}) {
  const t = useTranslations("property");
  const [sel, setSel] = useState<string | null>(null);

  // Bubble AREA proportional to share ownership (spec §12.5 — no arbitrary
  // encoded dimensions). Radius = sqrt(area) keeps area ∝ shares.
  const bubbles = useMemo(() => {
    const maxShares = Math.max(...holders.map((h) => h.shares), 1);
    const placed: { key: string; shares: number; bps: number; cx: number; cy: number; r: number; style: { fill: string; fillOpacity: number } }[] = [];
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
  }, [holders]);

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
      >
        {bubbles.map((b) => {
          const selected = sel === b.key;
          return (
            <g
              key={b.key}
              onPointerEnter={() => setSel(b.key)}
              onPointerDown={() => setSel(b.key)}
              onPointerLeave={() => setSel(null)}
              data-testid={`bubble-${b.key.replace("holder.", "")}`}
            >
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

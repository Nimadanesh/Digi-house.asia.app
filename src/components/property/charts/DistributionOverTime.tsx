"use client";
// File responsibility: Token Distribution Over Time stacked area chart
// (REDESIGN-SPEC §12.4) — how ownership share of each anonymized holder bucket
// shifts across the 52-week shared ownership history. Consumes ONLY the Phase 4
// shared ownershipHistory dataset; no PII, no chart-local random data.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { OwnershipPoint } from "@/lib/property-analytics";
import {
  CHART_W,
  CHART_H,
  PAD_X,
  PAD_TOP,
  PAD_BOTTOM,
  GridLines,
  DateLabels,
  HOLDER_COLORS,
  RangePills,
  HitZones,
  useHitZones,
  shortDate,
} from "../charts/shared";

const RANGES = ["1M", "3M", "6M", "1Y", "ALL"] as const;
type RangeKey = (typeof RANGES)[number];

function rangeLabel(r: RangeKey): string {
  return r === "ALL" ? "All" : r;
}

const RANGE_WEEKS: Record<RangeKey, number> = {
  "1M": 4,
  "3M": 13,
  "6M": 26,
  "1Y": 52,
  ALL: 52,
};

export function DistributionOverTime({ history }: { history: OwnershipPoint[] }) {
  const t = useTranslations("property");
  const [range, setRange] = useState<RangeKey>("1Y");
  const [sel, setSel] = useState<number | null>(null);

  const points = useMemo(
    () => history.slice(Math.max(0, history.length - RANGE_WEEKS[range])),
    [history, range],
  );

  // Stacked bands: one band per holder bucket (shares as % of totalShares per week).
  const bands = useMemo(() => {
    if (points.length === 0) return [];
    const bucketCount = points[0].buckets.length;
    const step = (CHART_W - 2 * PAD_X) / Math.max(1, points.length - 1);
    const x = (i: number) => PAD_X + i * step;
    const yFromFrac = (frac: number) =>
      PAD_TOP + (1 - frac) * (CHART_H - PAD_TOP - PAD_BOTTOM);

    // cumulative tops per week
    const cum: number[][] = [];
    let acc = new Array(bucketCount).fill(0);
    for (const p of points) {
      const fracs = p.buckets.map((b) => b.shares / Math.max(1, p.buckets.reduce((s, b) => s + b.shares, 0)));
      acc = acc.map((a, i) => a + (fracs[i] ?? 0));
      cum.push([...acc]);
    }

    return Array.from({ length: bucketCount }, (_, b) => {
      const lower = cum.map((c) => (b === 0 ? 0 : c[b - 1] ?? 0));
      const upper = cum.map((c) => c[b] ?? 0);
      // Normalize so the stack top sits at 1 (fractions of the whole).
      const norm = cum[cum.length - 1][bucketCount - 1] || 1;
      const upperPath = upper
        .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${yFromFrac(v / norm).toFixed(1)}`)
        .join(" ");
      const lowerRev = [...lower].reverse();
      const lowerPath = lowerRev
        .map((v, ri) => {
          const i = lowerRev.length - 1 - ri;
          return `L ${x(i).toFixed(1)} ${yFromFrac(v / norm).toFixed(1)}`;
        })
        .join(" ");
      const path = `${upperPath} ${lowerPath} Z`;
      return {
        key: points[0].buckets[b].label,
        path,
        style: HOLDER_COLORS[b] ?? HOLDER_COLORS[HOLDER_COLORS.length - 1],
        fracs: points.map((p) => (p.buckets[b]?.shares ?? 0) / Math.max(1, p.buckets.reduce((s, x2) => s + x2.shares, 0))),
      };
    });
  }, [points]);

  const xs = useHitZones(points.length);
  const selPoint = sel != null ? points[sel] : null;

  return (
    <div className="space-y-3" data-testid="distribution-over-time">
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full"
        role="img"
        aria-label={t("distributionOverTimeTitle")}
        data-testid="distribution-svg"
      >
        <GridLines />
        {bands.map((band) => (
          <path
            key={band.key}
            d={band.path}
            fill={band.style.fill}
            fillOpacity={band.style.fillOpacity}
            stroke="var(--color-card)"
            strokeWidth="1"
            data-testid={`stack-band-${band.key.replace("holder.", "")}`}
          />
        ))}
        <HitZones xs={xs} onIndex={setSel} />
        <DateLabels
          firstAt={points[0]?.at ?? ""}
          lastAt={points[points.length - 1]?.at ?? ""}
        />
      </svg>

      <RangePills
        ranges={RANGES as unknown as RangeKey[]}
        active={range}
        onChange={setRange}
        label={rangeLabel}
        testIdPrefix="dist"
      />

      {/* Tap tooltip — date + each category's token count and percentage */}
      <div
        className="min-h-[4.5rem] rounded-[10px] bg-surface-2 px-3 py-2 text-xs leading-relaxed text-foreground"
        data-testid="distribution-tooltip"
      >
        {selPoint ? (
          <>
            <span className="font-semibold">{shortDate(selPoint.at)}</span>
            {" · "}
            {selPoint.buckets.map((b, i) => (
              <span key={b.label}>
                {i > 0 ? " · " : ""}
                <span className="font-semibold">{t(b.label)}</span>{" "}
                <span className="tnum">{b.shares.toLocaleString()}</span>{" "}
                <span className="tnum text-muted-foreground">
                  ({(b.weightBps / 100).toFixed(1)}%)
                </span>
              </span>
            ))}
          </>
        ) : (
          t("distributionTapHint")
        )}
      </div>
    </div>
  );
}

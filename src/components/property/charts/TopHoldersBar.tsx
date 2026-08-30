"use client";
// File responsibility: Top Token Holders horizontal bar chart (REDESIGN-SPEC
// §12.2) — ranked anonymized holder rows with rank, label, share count and
// percentage. Consumes ONLY the Phase 4 shared holder dataset; no PII.
import { useTranslations } from "next-intl";
import type { HolderBucket } from "@/lib/property-analytics";
import { HOLDER_COLORS, OTHERS_COLOR } from "./shared";

export function TopHoldersBar({
  holders,
  totalShares,
}: {
  holders: HolderBucket[];
  totalShares: number;
}) {
  const t = useTranslations("property");

  const ranked = [...holders]
    .map((h, i) => ({
      label: h.label,
      shares: h.shares,
      bps: h.weightBps,
      style: HOLDER_COLORS[i] ?? HOLDER_COLORS[HOLDER_COLORS.length - 1],
    }))
    .sort((a, b) => b.shares - a.shares);

  return (
    <div className="space-y-2" data-testid="top-holders-bar">
      {ranked.map((h, rank) => (
        <div
          key={h.label}
          className="flex items-center gap-2 rounded-[10px] bg-surface-2 px-3 py-2"
          data-testid={`holder-row-${rank}`}
        >
          <span className="w-5 shrink-0 text-center text-xs font-bold text-muted-foreground tnum">
            {rank + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[0.8125rem] font-medium text-foreground">
                {t(h.label)}
              </span>
              <span className="text-[0.8125rem] text-foreground tnum">
                {h.shares.toLocaleString()}{" "}
                <span className="text-muted-foreground">
                  · {(h.bps / 100).toFixed(1)}%
                </span>
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(h.shares / Math.max(1, totalShares)) * 100}%`,
                  backgroundColor: h.style.fill,
                  opacity: h.style.fillOpacity,
                }}
                data-testid={`holder-bar-${rank}`}
              />
            </div>
          </div>
        </div>
      ))}
      {/* Others bucket, when the dataset has more buckets than the bar list shows */}
      {(() => {
        const shown = ranked.length;
        const othersShares = holders
          .slice()
          .sort((a, b) => b.shares - a.shares)
          .slice(shown)
          .reduce((s, h) => s + h.shares, 0);
        if (othersShares <= 0) return null;
        return (
          <div className="flex items-center gap-2 rounded-[10px] bg-surface-2 px-3 py-2" data-testid="holder-row-others">
            <span className="w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[0.8125rem] font-medium text-foreground">
                  {t("holder.others")}
                </span>
                <span className="text-[0.8125rem] text-foreground tnum">
                  {othersShares.toLocaleString()}{" "}
                  <span className="text-muted-foreground">
                    · {((othersShares / Math.max(1, totalShares)) * 100).toFixed(1)}%
                  </span>
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(othersShares / Math.max(1, totalShares)) * 100}%`,
                    backgroundColor: OTHERS_COLOR.fill,
                    opacity: OTHERS_COLOR.fillOpacity,
                  }}
                  data-testid="holder-bar-others"
                />
              </div>
            </div>
          </div>
        );
      })()}
      <p className="px-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
        {t("holderPrivacyNote")}
      </p>
    </div>
  );
}

"use client";
// File responsibility: Income by estate (UI Mapping §7.1 P0) — received (paid) income grouped
// per estate, each row links to the estate detail. Estates without paid entries are simply
// absent (honest — never a fabricated zero). With position data (holdings + locks), rows
// extend to ownership plus projected/accrued states from their own sources; missing pieces
// render Pending, never $0. Pure display: aggregates existing fields, no new financial math.
import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Gift } from "lucide-react";
import { useTranslations } from "next-intl";
import { Block } from "@/components/common/Block";
import { usd, pct } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { groupIncomeByEstate } from "@/lib/earnings-stats";
import { estateContribution } from "@/lib/income-chart-model";
import { summarizeEstates, type EstateIncome } from "@/lib/income-view-model";
import type { EstateDisplayIdentity } from "@/lib/economics/estates/estate-display-identity";
import type { EarningsEntry } from "@/types/earnings";
import type { Holding } from "@/types/position";
import type { ShareLock } from "@/types/lock";

const THUMB = "size-12 shrink-0 rounded-[10px] overflow-hidden bg-surface-2 relative";

export function IncomeByEstate({
  entries,
  propertyById,
  holdings,
  locks,
}: {
  entries: EarningsEntry[];
  /** Canonical estate identity for names/images; estates without entries simply absent. */
  propertyById: Map<string, EstateDisplayIdentity>;
  /** Present → rows extend to ownership + projected/accrued states per position. */
  holdings?: Holding[];
  locks?: ShareLock[];
}) {
  const t = useTranslations("earnings");

  const rows = useMemo(() => {
    if (holdings === undefined) {
      const grouped = groupIncomeByEstate(entries);
      const out: { propertyId: string; receivedUsd: number; name: string; location: string; image?: string }[] = [];
      for (const [propertyId, { receivedUsd }] of grouped) {
        // PROMPT 03-C: identity arrives canonicalized from the page; unknown
        // ids stay honest (id + empty location, no invented facts).
        const identity = propertyById.get(propertyId);
        out.push({
          propertyId,
          receivedUsd,
          name: identity?.name ?? propertyId,
          location: identity?.location ?? "",
          image: identity?.image,
        });
      }
      return { extended: false as const, rows: out };
    }
    const states = summarizeEstates({ entries, locks: locks ?? [], holdings });
    return {
      extended: true as const,
      rows: states.map((s) => {
        const identity = propertyById.get(s.propertyId);
        return {
          ...s,
          name: identity?.name ?? s.propertyId,
          location: identity?.location ?? "",
          image: identity?.image,
        };
      }),
    };
  }, [entries, propertyById, holdings, locks]);

  if (rows.rows.length === 0) return null;

  const comp = estateContribution(entries);
  const compTotal = comp.reduce((s, c) => s + c.receivedUsd, 0);
  const compMax = Math.max(1, ...comp.map((c) => c.receivedUsd));
  const top = comp[0];
  const topName = top ? (propertyById.get(top.propertyId)?.name ?? top.propertyId) : null;

  return (
    <section className="space-y-3" data-testid="income-by-estate">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("byEstateTitle")}
      </h2>
      {comp.length > 0 ? (
        <Block className="p-4" data-testid="estate-comp">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[0.6875rem] font-medium text-muted-foreground">
              {t("journeyTotal")}
            </span>
            <span
              className="text-[1.375rem] font-bold leading-none tracking-[-0.02em] tnum text-foreground"
              data-testid="estate-comp-total"
            >
              {usd(compTotal)}
            </span>
          </div>
          <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
            {comp.map((c, i) => (
              <span
                key={c.propertyId}
                data-testid="estate-comp-segment"
                className="h-full bg-primary"
                style={{ width: `${c.sharePct}%`, opacity: [1, 0.55, 0.35, 0.25][i % 4] }}
              />
            ))}
          </div>
          <div className="mt-2.5 space-y-1.5">
            {comp.map((c) => (
              <div key={c.propertyId} className="flex items-baseline justify-between gap-2 text-xs">
                <span className="min-w-0 truncate text-muted-foreground">
                  {propertyById.get(c.propertyId)?.name ?? c.propertyId}
                </span>
                <span className="shrink-0 tnum font-semibold text-foreground">
                  {Math.round(c.sharePct)}%
                </span>
              </div>
            ))}
          </div>
          {comp.length > 1 && top != null && topName != null ? (
            <p
              className="mt-2.5 border-t border-border pt-2 text-[0.6875rem] leading-relaxed text-muted-foreground"
              data-testid="estate-comp-insight"
            >
              {t("compInsight", { name: topName, pct: Math.round(top.sharePct) })}
            </p>
          ) : null}
        </Block>
      ) : null}
      <Block className="overflow-hidden divide-y divide-border" data-testid="income-by-estate-block">
        {rows.extended
          ? rows.rows.map((row) => (
              <IncomeRow
                key={row.propertyId}
                row={{
                  propertyId: row.propertyId,
                  receivedUsd: row.paidUsd.state === "known" ? row.paidUsd.amountUsd : 0,
                  name: row.name,
                  location: row.location,
                  image: row.image,
                }}
                extended={row}
                maxReceived={compMax}
              />
            ))
          : rows.rows.map((row) => (
              <IncomeRow key={row.propertyId} row={row} extended={null} maxReceived={compMax} />
            ))}
      </Block>
    </section>
  );
}

type LegacyRow = {
  propertyId: string;
  receivedUsd: number;
  name: string;
  location: string;
  image?: string;
};

type ExtendedRow = EstateIncome & { name: string; location: string; image?: string };

function IncomeRow({
  row,
  extended,
  maxReceived,
}: {
  row: LegacyRow;
  extended: ExtendedRow | null;
  maxReceived: number;
}) {
  const t = useTranslations("earnings");
  const tCommon = useTranslations("common");
  const rankPct = maxReceived > 0 ? Math.min(100, (row.receivedUsd / maxReceived) * 100) : 0;
  const estateHref = `/property/${row.propertyId}`;
  return (
    <article className="p-5" data-testid={`income-by-estate-card-${row.propertyId}`}>
      <Link
        href={estateHref}
        onClick={() => haptics.selection()}
        className="flex min-h-[60px] items-center gap-3.5 text-left active:opacity-80 transition-opacity duration-[120ms] ease-out"
        aria-label={row.name}
        data-testid={`income-by-estate-row-${row.propertyId}`}
      >
        <div className={THUMB} aria-hidden>
          {row.image ? (
            <Image src={row.image} alt="" fill className="object-cover" sizes="48px" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-[0.9375rem] font-semibold leading-snug text-foreground">
            {row.name}
          </p>
          <p className="truncate text-[0.8125rem] leading-relaxed text-muted-foreground">
            {row.location}
          </p>
          {extended?.sharesOwned != null ? (
            <p className="truncate text-[0.8125rem] leading-relaxed text-muted-foreground tnum">
              {extended.sharesOwned.toLocaleString()}{" "}
              {extended.sharesOwned === 1 ? tCommon("share") : tCommon("shares")}
              {extended.shareRatio != null ? ` · ${pct(extended.shareRatio)}` : ""}
            </p>
          ) : null}
        </div>
        <div className="ms-2 shrink-0 text-right space-y-1">
          {extended ? (
            <>
              <StateLine
                label={t("byEstateReceived")}
                value={extended.paidUsd}
                strong
              />
              <StateLine label={t("chartLegendProjected")} value={extended.projectedUsd} />
              <StateLine label={t("timelineAccrued")} value={extended.accruedUsd} />
            </>
          ) : (
            <>
              <p className="tnum text-[0.9375rem] font-semibold leading-snug text-foreground">
                {usd(row.receivedUsd)}
              </p>
              <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                {t("byEstateReceived")}
              </p>
            </>
          )}
        </div>
        <ChevronRight
          size={18}
          strokeWidth={1.75}
          className="shrink-0 text-muted-foreground rtl:rotate-180"
          aria-hidden
        />
      </Link>
      <div className="mt-3.5 h-1 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <div
          data-testid={`estate-rank-${row.propertyId}`}
          className="h-full rounded-full bg-primary/70"
          style={{ width: `${rankPct}%` }}
        />
      </div>
      <div className="mt-4">
        <Link
          href={estateHref}
          onClick={() => haptics.selection()}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-[10px] bg-surface-2 px-4 text-[0.875rem] font-semibold text-primary active:scale-[0.97] transition-transform duration-[120ms] ease-out"
          data-testid={`gift-shares-${row.propertyId}`}
          aria-label={t("giftShares")}
        >
          <Gift size={16} strokeWidth={1.75} aria-hidden className="shrink-0" />
          {t("giftShares")}
        </Link>
      </div>
    </article>
  );
}

function StateLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: EstateIncome["paidUsd"];
  strong?: boolean;
}) {
  const tCommon = useTranslations("common");
  if (value.state === "none") return null;
  return (
    <p
      className={
        strong
          ? "tnum text-[0.9375rem] font-semibold leading-snug text-foreground"
          : "text-[0.8125rem] leading-relaxed text-muted-foreground tnum"
      }
    >
      {label}{" "}
      {value.state === "known" ? (
        <span className={strong ? "" : "font-semibold text-foreground"}>{usd(value.amountUsd)}</span>
      ) : value.state === "pending" ? (
        tCommon("pending")
      ) : null}
    </p>
  );
}

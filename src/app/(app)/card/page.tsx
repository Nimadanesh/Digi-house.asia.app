"use client";
// File responsibility: Card promo page — premium dark navy card upsell. The card
// sits inside BorderBeam (ocean) with a clean dark face; balance binds to the
// existing Home view model
// (usePortfolio + PortfolioSummary.totalValueUsd with HomeHero's ownership rule);
// no math, no new data, no ordering/payment flow. The CTA is presentation-only
// (haptic). Back/close returns via router.back() — the established nested-route
// pattern.
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { BorderBeam } from "border-beam";
import { usePortfolio } from "@/hooks/usePortfolio";
import { usd } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { ErrorState } from "@/components/common/ErrorState";

const BENEFIT_KEYS = ["benefit1", "benefit2", "benefit3"] as const;

export default function CardPage() {
  const t = useTranslations("card");
  const router = useRouter();
  const portfolio = usePortfolio();

  if (portfolio.isLoading && !portfolio.data) {
    return (
      <div className="-mx-4 px-4 pb-6 pt-2" data-testid="card-loading">
        <div className="h-[420px] animate-pulse rounded-[20px] bg-surface-2/50" />
      </div>
    );
  }

  if (portfolio.isError && !portfolio.data) {
    return (
      <div className="-mx-4 space-y-3 px-4 pb-6 pt-2" data-testid="card-error">
        <ErrorState
          message={t("loadError")}
          onRetry={() => {
            haptics.impact("light");
            void portfolio.refetch();
          }}
        />
      </div>
    );
  }

  // Same balance rule as HomeHero: estate value when owning, $0 otherwise.
  const summary = portfolio.data;
  const hasOwnership = (summary?.holdings.length ?? 0) > 0;
  const amount = hasOwnership && summary ? usd(summary.totalValueUsd) : usd(0);

  const close = () => {
    haptics.selection();
    router.back();
  };

  return (
    <div className="-mx-4 px-4 pb-6" data-testid="card-page">
      <div className="relative -mx-4 flex min-h-[78svh] flex-col overflow-hidden bg-[#050914] px-6 pb-8 pt-2">
        {/* Calm ocean-family ambient wash behind the content — the animated
            border beam on the card is the primary effect. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_30%_at_50%_18%,rgba(56,130,246,0.18)_0%,transparent_65%),linear-gradient(180deg,rgba(10,18,40,0.5)_0%,transparent_35%,transparent_70%,rgba(0,0,0,0.5)_100%)]"
        />

        {/* Top row: badge left, close right (returns to Home). */}
        <div className="relative z-10 flex items-center justify-between">
          <span
            data-testid="card-badge"
            className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[11px] font-medium leading-tight tracking-[0.14em] text-white/80"
          >
            {t("badge")}
          </span>
          <button
            type="button"
            onClick={close}
            aria-label={t("close")}
            data-testid="card-close"
            className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-white active:opacity-80"
          >
            <X size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>

        {/* Floating premium card with the live Home balance. */}
        <div className="relative z-10 mt-6 w-full">
          {/* Golden halo: soft elliptical jewelry-gold support behind the card,
              diagonal bias echoing the beam travel. Static, heavily blurred. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[300px] w-[130%] max-w-none -rotate-6 rounded-[50%] bg-[#8C6A2F]/25 blur-[80px]" />
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[190px] w-[95%] max-w-none -rotate-6 rounded-[50%] bg-[#C2A46B]/20 blur-[50px]" />
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[110px] w-[60%] max-w-none -rotate-6 rounded-[50%] bg-[#E8D5A3]/15 blur-[40px]" />
          </div>
          <BorderBeam size="md" colorVariant="ocean" strength={0.7} theme="dark">
            <div
              data-testid="card-preview"
              className="relative overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-b from-[#0d1b3d] to-[#070d1f] p-6 shadow-[0_20px_60px_rgba(8,15,35,0.6),inset_0_1px_0_rgba(255,255,255,0.12)]"
            >
              <p className="relative text-[10px] font-medium uppercase leading-tight tracking-[0.24em] text-white/70">
                {t("premiumLabel")}
              </p>
              <p
                data-testid="card-balance"
                className="balance-shimmer relative mt-3 max-w-full truncate text-[34px] leading-none tnum"
              >
                {amount}
              </p>
              <div className="relative mt-8 flex items-end justify-between">
                <div className="flex" aria-hidden>
                  <span className="size-8 rounded-full bg-white/15" />
                  <span className="-ml-4 size-8 rounded-full bg-white/10" />
                </div>
                <p className="text-[17px] font-bold leading-none tracking-[-0.01em] text-white">
                  {t("brand")}
                </p>
              </div>
            </div>
          </BorderBeam>
        </div>

        {/* Headline + benefits — left aligned, card stays the hero. */}
        <h1 className="relative z-10 mt-8 max-w-[300px] break-words text-left text-[32px] font-bold leading-[1.08] tracking-[-0.03em] text-white">
          {t("headline")}
        </h1>
        <ul className="relative z-10 mt-5 w-full space-y-3" data-testid="card-benefits">
          {BENEFIT_KEYS.map((key) => (
            <li key={key} className="flex min-w-0 items-center gap-3">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/[0.05] ring-1 ring-white/15"
                aria-hidden
              >
                <Check size={14} strokeWidth={2.5} className="text-white/70" />
              </span>
              <span className="min-w-0 break-words text-sm leading-snug text-white/65">{t(key)}</span>
            </li>
          ))}
        </ul>

        {/* Bottom CTA + support line. */}
        <div className="relative z-10 mt-auto pt-10">
          <button
            type="button"
            onClick={() => haptics.selection()}
            data-testid="card-cta"
            className="flex h-[56px] w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-800 via-blue-500 to-sky-400 text-[16px] font-semibold text-white shadow-[0_14px_44px_rgba(59,130,246,0.45)] transition-transform duration-150 ease-out active:scale-[0.98]"
          >
            {t("cta")}
          </button>
          <p className="mt-3 text-center text-xs leading-relaxed text-white/50">{t("support")}</p>
        </div>
      </div>
    </div>
  );
}

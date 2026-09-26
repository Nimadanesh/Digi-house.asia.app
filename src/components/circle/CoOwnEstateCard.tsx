"use client";
// File responsibility: estate co-own invite card — share one specific estate
// with a future co-owner ("I found an estate we could own together").
// Estate-scoped link only; no attribution backend, no second referral system.
import { Check, Copy, Share2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import { useCoOwnInvite } from "@/hooks/useCoOwnInvite";
import { Block } from "@/components/common/Block";

export function CoOwnEstateCard({ estateId, estateTitle }: { estateId: string; estateTitle: string }) {
  const t = useTranslations("circle");
  const { copied, canShare, shareCoOwn, copyCoOwn } = useCoOwnInvite(estateId);

  return (
    <section aria-label={`${t("coOwnTitle")} — ${estateTitle}`} data-testid="estate-coown">
      <Block className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-primary/12 text-primary">
            <Users size={20} strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug text-foreground">{t("coOwnTitle")}</p>
            <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{t("coOwnSub")}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            data-testid="estate-coown-share"
            disabled={!canShare}
            onClick={() => {
              haptics.selection();
              void shareCoOwn();
            }}
            className="inline-flex h-[48px] flex-1 items-center justify-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform duration-[120ms] ease-out active:scale-[0.97] disabled:opacity-50"
          >
            {copied ? <Check size={18} strokeWidth={2} aria-hidden /> : <Share2 size={18} strokeWidth={2} aria-hidden />}
            {copied ? t("coOwnCopied") : !canShare ? t("coOwnSignIn") : t("coOwnShare")}
          </button>
          <button
            type="button"
            data-testid="estate-coown-copy"
            disabled={!canShare}
            aria-label={t("coOwnCopy")}
            onClick={() => {
              haptics.selection();
              void copyCoOwn();
            }}
            className="inline-flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-foreground transition-transform duration-[120ms] ease-out active:scale-[0.97] disabled:opacity-50"
          >
            <Copy size={18} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </Block>
    </section>
  );
}

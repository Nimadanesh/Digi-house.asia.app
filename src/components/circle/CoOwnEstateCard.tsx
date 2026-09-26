"use client";
// File responsibility: estate co-own invite card — share one specific estate
// with a future co-owner ("I found an estate we could own together").
// Estate-scoped link only; no attribution backend, no second referral system.
// Logged-out users get an active sign-in entry; logged-in users get the
// active co-own actions, never a disabled sign-in.
import Link from "next/link";
import { Check, Copy, Share2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import { useCoOwnInvite } from "@/hooks/useCoOwnInvite";
import { ROUTES } from "@/lib/constants";
import { Block } from "@/components/common/Block";

export function CoOwnEstateCard({ estateId, estateTitle }: { estateId: string; estateTitle: string }) {
  const t = useTranslations("circle");
  const { copied, isLoggedIn, shareCoOwn, copyCoOwn } = useCoOwnInvite(estateId);

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
        {!isLoggedIn ? (
          <Link
            href={ROUTES.recoveryLogin}
            onClick={() => haptics.selection()}
            data-testid="estate-coown-share"
            className="mt-3 inline-flex h-[48px] w-full items-center justify-center rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform duration-[120ms] ease-out active:scale-[0.97]"
          >
            {t("coOwnSignIn")}
          </Link>
        ) : (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              data-testid="estate-coown-share"
              onClick={() => {
                haptics.selection();
                void shareCoOwn();
              }}
              className="inline-flex h-[48px] flex-1 items-center justify-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform duration-[120ms] ease-out active:scale-[0.97]"
            >
              {copied ? <Check size={18} strokeWidth={2} aria-hidden /> : <Share2 size={18} strokeWidth={2} aria-hidden />}
              {copied ? t("coOwnCopied") : t("coOwnShare")}
            </button>
            <button
              type="button"
              data-testid="estate-coown-copy"
              aria-label={t("coOwnCopy")}
              onClick={() => {
                haptics.selection();
                void copyCoOwn();
              }}
              className="inline-flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-foreground transition-transform duration-[120ms] ease-out active:scale-[0.97]"
            >
              <Copy size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>
        )}
      </Block>
    </section>
  );
}

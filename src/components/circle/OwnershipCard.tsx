"use client";
// File responsibility: Ownership Card — a minimal premium statement of a REAL
// ownership relationship ("I own a piece of this estate") with Share
// Ownership. Renders only when ownedShares > 0; never any amounts, yields,
// points, tiers, or referral mechanics. No fake ownership, ever.
import Link from "next/link";
import { Check, Copy, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import { useShareOwnership } from "@/hooks/useShareOwnership";
import { ROUTES } from "@/lib/constants";
import { Block } from "@/components/common/Block";

export function OwnershipCard({
  estateId,
  estateTitle,
  location,
  ownedShares,
}: {
  estateId: string;
  estateTitle: string;
  location: string;
  ownedShares: number;
}) {
  const t = useTranslations("circle");
  const { copied, isLoggedIn, shareOwnership, copyOwnership } = useShareOwnership(
    estateId,
    estateTitle,
  );

  if (!(ownedShares > 0)) return null;

  return (
    <section aria-label={`${t("ownerLabel")} — ${estateTitle}`} data-testid="estate-ownership">
      <Block className="p-5">
        <p className="text-[11px] font-semibold uppercase leading-tight tracking-[0.14em] text-muted-foreground">
          {t("ownerLabel")}
        </p>
        <p className="mt-2 text-[0.9375rem] font-medium leading-snug text-foreground">
          {t("ownerStatement")}
        </p>
        <p className="mt-1 text-[1.25rem] font-semibold leading-tight tracking-tight text-foreground">
          {estateTitle}
        </p>
        <p className="mt-0.5 truncate text-sm leading-relaxed text-muted-foreground">{location}</p>
        {!isLoggedIn ? (
          <Link
            href={ROUTES.recoveryLogin}
            onClick={() => haptics.selection()}
            data-testid="estate-ownership-share"
            className="mt-4 inline-flex h-[48px] w-full items-center justify-center rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform duration-[120ms] ease-out active:scale-[0.97]"
          >
            {t("ownerSignIn")}
          </Link>
        ) : (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              data-testid="estate-ownership-share"
              onClick={() => {
                haptics.selection();
                void shareOwnership();
              }}
              className="inline-flex h-[48px] flex-1 items-center justify-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform duration-[120ms] ease-out active:scale-[0.97]"
            >
              {copied ? (
                <Check size={18} strokeWidth={2} aria-hidden />
              ) : (
                <Share2 size={18} strokeWidth={2} aria-hidden />
              )}
              {copied ? t("ownerCopied") : t("ownerShare")}
            </button>
            <button
              type="button"
              data-testid="estate-ownership-copy"
              aria-label={t("ownerCopy")}
              onClick={() => {
                haptics.selection();
                void copyOwnership();
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

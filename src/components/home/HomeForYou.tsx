"use client";
// File responsibility: Home's single merchandising slot — one Featured estate card
// from the existing featured listing, or (when featured is honestly empty) one
// Invite card opening the existing referrals UI in SettingsSheet. Never both,
// never a list. Binds to existing listing fields only; no new math.
//
// Empty Home passes showInvite so the Invite card also renders under the listing;
// filled Home omits it and keeps the card-or-invite exclusive behavior.
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Listing } from "@/types/property";
import { Block } from "@/components/common/Block";
import { useUiStore } from "@/stores/ui.store";
import { haptics } from "@/lib/telegram/haptics";
import { ROUTES } from "@/lib/constants";
import { usd } from "@/lib/format";

export function HomeForYou({
  listing,
  showInvite,
}: {
  listing: Listing | null;
  showInvite?: boolean;
}) {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");
  const openSettings = useUiStore((s) => s.openSettings);

  const cover = listing?.images[0] ?? "/images/properties/p1.png";

  return (
    <section className="space-y-2" data-testid="home-foryou">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">{t("forYou")}</h2>
      {listing ? (
        <Link
          href={ROUTES.property(listing.id)}
          onClick={() => haptics.selection()}
          data-testid="foryou-card"
          className="block active:scale-[0.99] transition-transform duration-[120ms] ease-out"
        >
          <Block className="overflow-hidden">
            <div className="relative aspect-[16/9] bg-surface-2">
              <Image
                src={cover}
                alt={listing.title}
                fill
                className="object-cover"
                sizes="(max-width:480px) 100vw, 480px"
              />
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.9375rem] font-semibold leading-snug text-foreground">
                  {listing.title}
                </p>
                <p className="mt-0.5 truncate text-sm leading-relaxed text-muted-foreground">
                  {listing.location}
                </p>
                <p className="mt-1.5 text-sm tnum text-foreground">
                  <span className="text-muted-foreground">{tCommon("from")} </span>
                  <span className="font-semibold">
                    {usd(listing.sharePriceUsd)}/{tCommon("share")}
                  </span>
                </p>
              </div>
              <ChevronRight
                size={20}
                strokeWidth={2}
                aria-hidden
                className="shrink-0 text-muted-foreground rtl:rotate-180"
              />
            </div>
          </Block>
        </Link>
      ) : null}
      {!listing || showInvite ? (
        <Block className="p-4" data-testid="foryou-invite">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-primary/12 text-primary">
              <UserPlus size={20} strokeWidth={1.75} aria-hidden />
            </div>
            <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground">
              {tSettings("inviteFriends")}
            </p>
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                openSettings();
              }}
              data-testid="foryou-invite-btn"
              className="inline-flex h-[44px] shrink-0 items-center justify-center rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out"
            >
              {t("invite")}
            </button>
          </div>
        </Block>
      ) : null}
    </section>
  );
}

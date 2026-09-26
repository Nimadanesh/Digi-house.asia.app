// File responsibility: share-ownership state + actions for one owned estate —
// ownership-share link (explicit "ownership" context, distinct from co-own
// invitations and referral attribution), Web Share first, clipboard fallback.
// Prototype only: no attribution backend. Silent no-op where unavailable.
"use client";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth.store";
import { env } from "@/lib/env";
import { buildCoOwnLink } from "@/lib/coown/co-own-link";
import { useShareActions } from "@/hooks/useShareActions";

export interface ShareOwnership {
  shareLink: string | null;
  canShare: boolean;
  isLoggedIn: boolean;
  copied: boolean;
  shareText: string;
  shareOwnership: () => Promise<void>;
  copyOwnership: () => Promise<void>;
}

export function useShareOwnership(estateId: string, estateTitle: string): ShareOwnership {
  const t = useTranslations("circle");
  const user = useAuthStore((s) => s.user);

  const shareLink = user?.id
    ? buildCoOwnLink({
        botUsername: env.botUsername,
        estateId,
        inviterId: user.id,
        context: "ownership",
      })
    : null;
  const canShare = shareLink !== null;
  const isLoggedIn = user != null;
  const shareText = t("shareText", { estate: estateTitle });
  const { copied, copyLink } = useShareActions(shareLink);

  async function shareOwnership(): Promise<void> {
    if (!shareLink) return;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "FractionalLuxe", text: shareText, url: shareLink });
        return;
      }
    } catch {
      // Share dismissed: silent, CTA keeps working.
    }
    await copyLinkWithText();
  }

  async function copyOwnership(): Promise<void> {
    await copyLinkWithText();
  }

  async function copyLinkWithText(): Promise<void> {
    if (!shareLink) return;
    // Reuse the base copied-feedback machine with the composed payload.
    await copyComposed();
  }

  async function copyComposed(): Promise<void> {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareLink}`);
      await copyLink();
    } catch {
      // Privacy-restricted contexts: stay silent, CTA keeps working.
    }
  }

  return { shareLink, canShare, isLoggedIn, copied, shareText, shareOwnership, copyOwnership };
}

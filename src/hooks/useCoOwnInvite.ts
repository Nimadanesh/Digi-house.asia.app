// File responsibility: invite-to-co-own share state + actions for one estate —
// estate-scoped link, Web Share first, clipboard fallback. Prototype only:
// no attribution backend. Silent no-op where share/clipboard are unavailable.
// `isLoggedIn` (auth state) is separate from `canShare` (link buildable).
"use client";
import { useAuthStore } from "@/stores/auth.store";
import { env } from "@/lib/env";
import { buildCoOwnLink } from "@/lib/coown/co-own-link";
import { useShareActions } from "@/hooks/useShareActions";

export interface CoOwnInvite {
  coOwnLink: string | null;
  canShare: boolean;
  isLoggedIn: boolean;
  copied: boolean;
  shareCoOwn: () => Promise<void>;
  copyCoOwn: () => Promise<void>;
}

export function useCoOwnInvite(estateId: string): CoOwnInvite {
  const user = useAuthStore((s) => s.user);

  const coOwnLink = user?.id
    ? buildCoOwnLink({ botUsername: env.botUsername, estateId, inviterId: user.id })
    : null;
  const canShare = coOwnLink !== null;
  const isLoggedIn = user != null;
  const {
    copied,
    copyLink: copyCoOwn,
    shareLink: shareBase,
  } = useShareActions(coOwnLink, "FractionalLuxe");

  return { coOwnLink, canShare, isLoggedIn, copied, shareCoOwn: shareBase, copyCoOwn };
}

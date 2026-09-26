// File responsibility: invite-link state + actions — the single source for the
// `t.me/<bot>?startapp=ref_<userId>` link, clipboard copy with "copied"
// feedback, and Web Share fallback. Prototype only: no code generation or
// tracking backend. Silent no-op where clipboard/share are unavailable.
// `isLoggedIn` (auth state) is separate from `canInvite` (link buildable).
"use client";
import { useAuthStore } from "@/stores/auth.store";
import { env } from "@/lib/env";
import { useShareActions } from "@/hooks/useShareActions";

export interface InviteLink {
  inviteLink: string | null;
  canInvite: boolean;
  isLoggedIn: boolean;
  copied: boolean;
  copyInvite: () => Promise<void>;
  shareInvite: () => Promise<void>;
}

export function useInviteLink(): InviteLink {
  const user = useAuthStore((s) => s.user);

  const inviteLink =
    env.botUsername && user?.id ? `https://t.me/${env.botUsername}?startapp=ref_${user.id}` : null;
  const canInvite = inviteLink !== null;
  const isLoggedIn = user != null;
  const { copied, copyLink: copyInvite, shareLink: shareInvite } = useShareActions(inviteLink);

  return { inviteLink, canInvite, isLoggedIn, copied, copyInvite, shareInvite };
}

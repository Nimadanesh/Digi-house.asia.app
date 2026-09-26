// File responsibility: invite-link state + actions — the single source for the
// `t.me/<bot>?startapp=ref_<userId>` link, clipboard copy with "copied"
// feedback, and Web Share fallback. Prototype only: no code generation or
// tracking backend. Silent no-op where clipboard/share are unavailable.
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { env } from "@/lib/env";

export interface InviteLink {
  inviteLink: string | null;
  canInvite: boolean;
  copied: boolean;
  copyInvite: () => Promise<void>;
  shareInvite: () => Promise<void>;
}

export function useInviteLink(): InviteLink {
  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const inviteLink =
    env.botUsername && user?.id ? `https://t.me/${env.botUsername}?startapp=ref_${user.id}` : null;
  const canInvite = inviteLink !== null;

  const flagCopied = useCallback(() => {
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }, []);

  const copyInvite = useCallback(async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      flagCopied();
    } catch {
      // Privacy-restricted / non-secure contexts: stay silent, CTA keeps working.
    }
  }, [inviteLink, flagCopied]);

  const shareInvite = useCallback(async () => {
    if (!inviteLink) return;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ url: inviteLink });
        return;
      }
      await navigator.clipboard.writeText(inviteLink);
      flagCopied();
    } catch {
      // Share dismissed or unavailable: silent, CTA keeps working.
    }
  }, [inviteLink, flagCopied]);

  return { inviteLink, canInvite, copied, copyInvite, shareInvite };
}

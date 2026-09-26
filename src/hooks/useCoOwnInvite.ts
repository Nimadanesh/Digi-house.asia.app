// File responsibility: invite-to-co-own share state + actions for one estate —
// estate-scoped link, Web Share first, clipboard fallback. Prototype only:
// no attribution backend. Silent no-op where share/clipboard are unavailable.
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { env } from "@/lib/env";
import { buildCoOwnLink } from "@/lib/coown/co-own-link";

export interface CoOwnInvite {
  coOwnLink: string | null;
  canShare: boolean;
  copied: boolean;
  shareCoOwn: () => Promise<void>;
  copyCoOwn: () => Promise<void>;
}

export function useCoOwnInvite(estateId: string): CoOwnInvite {
  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const coOwnLink =
    user?.id ? buildCoOwnLink({ botUsername: env.botUsername, estateId, inviterId: user.id }) : null;
  const canShare = coOwnLink !== null;

  const flagCopied = useCallback(() => {
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }, []);

  const copyCoOwn = useCallback(async () => {
    if (!coOwnLink) return;
    try {
      await navigator.clipboard.writeText(coOwnLink);
      flagCopied();
    } catch {
      // Privacy-restricted / non-secure contexts: stay silent, CTA keeps working.
    }
  }, [coOwnLink, flagCopied]);

  const shareCoOwn = useCallback(async () => {
    if (!coOwnLink) return;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "FractionalLuxe", url: coOwnLink });
        return;
      }
      await navigator.clipboard.writeText(coOwnLink);
      flagCopied();
    } catch {
      // Share dismissed or unavailable: silent, CTA keeps working.
    }
  }, [coOwnLink, flagCopied]);

  return { coOwnLink, canShare, copied, shareCoOwn, copyCoOwn };
}

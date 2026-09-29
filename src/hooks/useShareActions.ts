// File responsibility: shared share/copy state machine — Web Share first,
// clipboard fallback, silent where unavailable, 2s copied feedback. Pure
// client interaction; no URLs built here (callers supply the link).
"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export interface ShareActions {
  copied: boolean;
  copyLink: () => Promise<void>;
  shareLink: () => Promise<void>;
}

export function useShareActions(link: string | null, shareTitle?: string): ShareActions {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const flagCopied = useCallback(() => {
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }, []);

  const copyLink = useCallback(async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      flagCopied();
    } catch {
      // Privacy-restricted / non-secure contexts: stay silent, CTA keeps working.
    }
  }, [link, flagCopied]);

  const shareLink = useCallback(async () => {
    if (!link) return;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(
          shareTitle ? { title: shareTitle, url: link } : { url: link },
        );
        return;
      }
      await navigator.clipboard.writeText(link);
      flagCopied();
    } catch {
      // Share dismissed or unavailable: silent, CTA keeps working.
    }
  }, [link, shareTitle, flagCopied]);

  return { copied, copyLink, shareLink };
}

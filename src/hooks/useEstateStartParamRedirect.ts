"use client";
// File responsibility: Telegram launch-param estate routing. A recipient who
// opens a shared Ownership / Co-Own (or plain estate) link must land on the
// SAME estate — never a generic home. Reads start_param once, after Telegram
// init and onboarding, then replaces the landing route with the estate.
// Routing only; no attribution, ledger, or settlement.
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTelegramReady } from "@/lib/telegram/TelegramProvider";
import { retrieveLaunchParams } from "@/lib/telegram/signals";
import { parseShareStartParam } from "@/lib/telegram/deep-link";
import { useSettingsStore } from "@/stores/settings.store";
import { ROUTES } from "@/lib/constants";

/** Pull the raw start_param from the Telegram launch params (null when absent). */
function readStartParam(): string | null {
  try {
    const params = retrieveLaunchParams();
    if (typeof params.tgWebAppStartParam === "string") return params.tgWebAppStartParam;
    const nested = params.tgWebAppData?.startParam;
    return typeof nested === "string" ? nested : null;
  } catch {
    // Outside Telegram / SDK not ready: no deep link to route.
    return null;
  }
}

/**
 * Route the recipient to the estate carried by the launch start_param.
 * Fires once per session: waits for Telegram init and for onboarding to
 * complete, then redirects only from the landing route so it can never hijack
 * in-app navigation: if the app is already on a different route the deep link
 * is intentionally ignored.
 */
export function useEstateStartParamRedirect(): void {
  const router = useRouter();
  const pathname = usePathname();
  const ready = useTelegramReady();
  const onboarded = useSettingsStore((s) => s.onboarded);
  const consumed = useRef(false);

  useEffect(() => {
    if (!ready || consumed.current) return;
    const target = parseShareStartParam(readStartParam());
    if (!target) {
      consumed.current = true;
      return;
    }
    // Onboarding (and profile setup) run first; the start_param persists for the
    // session, so wait until we are back on the landing route to redirect.
    if (!onboarded || pathname !== ROUTES.home) return;
    consumed.current = true;
    router.replace(ROUTES.property(target.estateId));
  }, [ready, onboarded, pathname, router]);
}

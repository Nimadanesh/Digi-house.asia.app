"use client";
// File responsibility: the ONE global Fifi entry point (FIFI-05) — a persistent
// floating button above the bottom edge, present on every chrome-ful route,
// opening the single global ChatSheet. Hidden only on chromeless routes (before
// onboarding). Position adapts to whatever owns the bottom edge, always keeping
// the same ~10px clearance above a primary CTA (mirrors the Earnings spacing):
// - Tab-bar pages: 84px baseline (clear of the 76px tab bar); 138px while a
//   sticky CTA shows (76 + 52 button + 10).
// - MainButton/bottom-chrome pages (estate): 20px baseline — no tab bar, the
//   button rests at the page bottom; 96px while the PropertyStickyCta shows
//   (12 pad + 52 button + scarcity line above it + 10 clearance).
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { CHROMELESS_ROUTES } from "@/lib/constants";
import { haptics } from "@/lib/telegram/haptics";
import { useUiStore } from "@/stores/ui.store";
import { FifiAvatar } from "./FifiAvatar";

export function FifiEntry() {
  const pathname = usePathname();
  const openFifi = useUiStore((s) => s.openFifi);
  const mainButtonActive = useUiStore((s) => s.mainButtonActive);
  const stickyCtaVisible = useUiStore((s) => s.stickyCtaVisible);
  const t = useTranslations("fifi.entry");

  if (CHROMELESS_ROUTES.has(pathname)) return null;

  const bottomClass = mainButtonActive
    ? // Bottom chrome page (estate): rests low; lifts over the sticky buy bar.
      stickyCtaVisible
      ? "bottom-[calc(96px+env(safe-area-inset-bottom))]"
      : "bottom-[calc(20px+env(safe-area-inset-bottom))]"
    : // Tab-bar page: clear of the tab bar; lifts over a sticky CTA.
      stickyCtaVisible
        ? "bottom-[calc(138px+env(safe-area-inset-bottom))]"
        : "bottom-[calc(84px+env(safe-area-inset-bottom))]";

  return (
    <div
      className={
        "pointer-events-none fixed inset-x-0 z-30 mx-auto flex max-w-[480px] justify-end px-4 " +
        bottomClass +
        " transition-[bottom] duration-200 ease-out"
      }
      data-testid="fifi-entry"
    >
      <button
        type="button"
        aria-label={t("open")}
        data-testid="fifi-entry-button"
        onClick={() => {
          haptics.impact("light");
          openFifi();
        }}
        className={
          "pointer-events-auto flex size-14 items-center justify-center rounded-full " +
          "shadow-[0_8px_24px_rgba(34,158,217,0.35)] " +
          "transition-transform duration-150 ease-out active:scale-[0.94]"
        }
      >
        <FifiAvatar size="lg" glow sheen />
      </button>
    </div>
  );
}

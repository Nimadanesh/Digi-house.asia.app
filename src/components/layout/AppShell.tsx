"use client";
// File responsibility: the app shell — fixed max-width canvas, shared AppHeader on tabs, optional title Header on nested routes.
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { AppHeader } from "./AppHeader";
import { BottomTabBar } from "./BottomTabBar";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { ProfileGate } from "@/components/profile/ProfileGate";
import { SettingsSheet } from "@/components/settings/SettingsSheet";
import { DemoModeBadge } from "@/components/common/DemoModeBadge";
import { ToastHost } from "@/components/common/ToastHost";
import { useTheme } from "@/hooks/useTheme";
import { useUiStore } from "@/stores/ui.store";
import { ROUTES, TABS } from "@/lib/constants";

const TAB_HREFS = new Set(TABS.map((t) => t.href));

const CHROMELESS = new Set<string>([
  ROUTES.onboarding,
  ROUTES.profileSetup,
  ROUTES.recoveryLogin,
]);

// Home canvas background (single source with the Home route): it must paint from the
// top of the viewport so the transparent tab header shows the blue fade, not a slab.
const HOME_BACKGROUND =
  "radial-gradient(ellipse 90% 55% at 50% -5%, rgba(34, 158, 217, 0.38) 0%, rgba(34, 158, 217, 0.10) 38%, transparent 68%), linear-gradient(180deg, #1b3f5c 0%, #17212b 46%, #111821 100%)";

export function AppShell({ children }: { children: React.ReactNode }) {
  useTheme();
  const mainButtonActive = useUiStore((s) => s.mainButtonActive);
  const pathname = usePathname();
  const chromeless = CHROMELESS.has(pathname);
  const isTab = TAB_HREFS.has(pathname);

  return (
    <div
      className="mx-auto flex min-h-svh max-w-[480px] flex-col bg-background"
      style={pathname === ROUTES.home ? { background: HOME_BACKGROUND } : undefined}
    >
      {chromeless ? null : isTab ? <AppHeader /> : <Header />}
      <main className="flex-1 px-4 pb-[calc(88px+env(safe-area-inset-bottom))]">
        <OnboardingGate>
          <ProfileGate>
            {/* Keyed by pathname: one shared, restrained page-enter transition on every
                route change (§page-enter in globals.css) — continuity, not showmanship. */}
            <div key={pathname} className="page-enter" data-testid="page-enter">
              {children}
            </div>
          </ProfileGate>
        </OnboardingGate>
      </main>
      {mainButtonActive || chromeless ? null : <BottomTabBar />}
      <DemoModeBadge />
      <ToastHost />
      <SettingsSheet />
    </div>
  );
}

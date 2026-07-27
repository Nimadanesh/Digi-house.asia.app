"use client";
// File responsibility: route gate — first-launch → /onboarding until settings.onboarded.
import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSettingsStore } from "@/stores/settings.store";
import { useUiStore } from "@/stores/ui.store";
import { ROUTES } from "@/lib/constants";
import { Skeleton } from "@/components/common/Skeleton";

function subscribeHydration(onStoreChange: () => void) {
  if (useSettingsStore.persist.hasHydrated()) {
    return () => {};
  }
  return useSettingsStore.persist.onFinishHydration(onStoreChange);
}

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const onboarded = useSettingsStore((s) => s.onboarded);
  const onboardingReplay = useUiStore((s) => s.onboardingReplay);

  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => useSettingsStore.persist.hasHydrated(),
    () => false,
  );

  useEffect(() => {
    if (!hydrated) return;
    const onOnboarding = pathname === ROUTES.onboarding;
    if (!onboarded && !onOnboarding) {
      router.replace(ROUTES.onboarding);
      return;
    }
    if (onboarded && onOnboarding && !onboardingReplay) {
      router.replace(ROUTES.home);
    }
  }, [hydrated, onboarded, onboardingReplay, pathname, router]);

  if (!hydrated) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24" data-testid="onboarding-gate-loading">
        <Skeleton className="size-16 rounded-[16px]" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
    );
  }

  const onOnboarding = pathname === ROUTES.onboarding;
  const blockedReplay = onboarded && onOnboarding && !onboardingReplay;
  if ((!onboarded && !onOnboarding) || blockedReplay) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24" data-testid="onboarding-gate-redirect">
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  return <>{children}</>;
}

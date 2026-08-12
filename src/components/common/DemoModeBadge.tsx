"use client";
// File responsibility: floating Demo mode pill → Settings.
import { usePathname } from "next/navigation";
import { useSettingsStore } from "@/stores/settings.store";
import { useUiStore } from "@/stores/ui.store";
import { ROUTES } from "@/lib/constants";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

export function DemoModeBadge() {
  const pathname = usePathname();
  const show = useSettingsStore((s) => s.showDemoBadge);
  const openSettings = useUiStore((s) => s.openSettings);
  const mainButtonActive = useUiStore((s) => s.mainButtonActive);

  if (
    !show ||
    pathname === ROUTES.onboarding ||
    pathname === ROUTES.profileSetup ||
    pathname === ROUTES.recoveryLogin ||
    mainButtonActive
  )
    return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-40 mx-auto flex max-w-[480px] justify-center",
        "bottom-[calc(72px+env(safe-area-inset-bottom)+4px)]",
      )}
    >
      <button
        type="button"
        data-testid="demo-mode-badge"
        onClick={() => {
          haptics.selection();
          openSettings();
        }}
        className="pointer-events-auto inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[0.6875rem] font-medium text-muted-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out"
        aria-label="Demo mode — open settings"
      >
        <span className="size-1.5 rounded-full bg-warning" aria-hidden />
        Demo mode
      </button>
    </div>
  );
}

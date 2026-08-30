"use client";
// File responsibility: compact property top bar (#07b) — back control + property
// name, revealed direction-aware on scroll-up once the user has scrolled past the
// hero. Fixed-height overlay → no layout jump; hides while any sheet owns the
// screen so it never conflicts with Telegram MainButton chrome. z-40 sits above
// content, below toasts (z-50).
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

export function PropertyCompactTopBar({
  title,
  visible,
  className,
}: {
  title: string;
  visible: boolean;
  className?: string;
}) {
  const router = useRouter();
  // Derived, not an effect: `shown` follows `visible` directly (exit transition is
  // driven by the class swap; the overlay stays mounted so nothing jumps).
  const shown = visible;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-40 mx-auto max-w-[480px]",
        "pt-[max(env(safe-area-inset-top),0px)]",
        className,
      )}
      data-testid="property-compact-topbar"
      aria-hidden={!shown}
    >
      <div
        className={cn(
          "compact-topbar pointer-events-auto flex h-11 items-center gap-1 bg-background/95 px-2 backdrop-blur-sm",
          "border-b border-border",
          shown ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none",
        )}
      >
        <button
          type="button"
          tabIndex={shown ? 0 : -1}
          onClick={() => {
            haptics.selection();
            router.back();
          }}
          aria-label="Back"
          data-testid="compact-topbar-back"
          className="flex size-11 shrink-0 items-center justify-center text-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out"
        >
          <ChevronLeft size={22} strokeWidth={1.75} />
        </button>
        <span className="truncate text-[0.9375rem] font-semibold text-foreground" data-testid="compact-topbar-title">
          {title}
        </span>
      </div>
    </div>
  );
}

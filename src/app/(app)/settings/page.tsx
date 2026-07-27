"use client";
// File responsibility: deep-link /settings → open Settings bottom sheet and return to Home.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/stores/ui.store";
import { ROUTES } from "@/lib/constants";

export default function SettingsPage() {
  const router = useRouter();
  const openSettings = useUiStore((s) => s.openSettings);

  useEffect(() => {
    openSettings();
    router.replace(ROUTES.home);
  }, [router, openSettings]);

  return (
    <div className="flex flex-1 items-center justify-center py-24" data-testid="settings-redirect">
      <p className="text-sm text-muted-foreground">Opening settings…</p>
    </div>
  );
}

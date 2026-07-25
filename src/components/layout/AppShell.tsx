"use client";
// File responsibility: the app shell — fixed max-width canvas, Header, scroll main, optional BottomTabBar.
// When a screen owns the Telegram MainButton (mainButtonActive=true), we drop the in-app tab bar so the
// native MainButton is the sole bottom chrome (DESIGN_SYSTEM: "Hide the app tab bar's chrome conflict —
// MainButton is bottom-most") and shrink the main bottom pad to the MainButton's 50px + safe-area.
import { Header } from "./Header";
import { BottomTabBar } from "./BottomTabBar";
import { useTheme } from "@/hooks/useTheme";
import { useUiStore } from "@/stores/ui.store";

export function AppShell({ children }: { children: React.ReactNode }) {
  useTheme();
  const mainButtonActive = useUiStore((s) => s.mainButtonActive);
  return (
    <div className="mx-auto flex min-h-svh max-w-[480px] flex-col bg-background">
      <Header />
      <main
        className={
          mainButtonActive
            ? "flex-1 px-4 pb-[calc(50px+env(safe-area-inset-bottom))]"
            : "flex-1 px-4 pb-[calc(52px+env(safe-area-inset-bottom))]"
        }
      >
        {children}
      </main>
      {mainButtonActive ? null : <BottomTabBar />}
    </div>
  );
}
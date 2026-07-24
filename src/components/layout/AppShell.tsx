"use client";
import { Header } from "./Header";
import { BottomTabBar } from "./BottomTabBar";
import { MainButtonBridge } from "./MainButtonBridge";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-svh max-w-[480px] flex-col bg-background">
      <Header />
      <main className="flex-1 px-4 pb-[calc(52px+env(safe-area-inset-bottom))]">{children}</main>
      <MainButtonBridge />
      <BottomTabBar />
    </div>
  );
}
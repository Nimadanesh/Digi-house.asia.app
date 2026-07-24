"use client";

// File responsibility: compose client providers. Thin — no logic.
// Phase 2 TON foundation wires TonConnect here. The Telegram SDK provider +
// TanStack QueryClientProvider land in the parallel foundation subset (separate plan);
// add them inside this tree when they arrive.
import { TonConnectUIProvider, THEME } from "@tonconnect/ui-react";
import { resolveManifestUrl } from "@/lib/ton/manifest";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider
      manifestUrl={resolveManifestUrl()}
      restoreConnection
      uiPreferences={{ theme: THEME.DARK }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
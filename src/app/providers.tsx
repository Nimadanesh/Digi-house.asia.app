"use client";
// File responsibility: compose the client provider tree (thin). Order: Telegram -> TonConnect -> Query.
// TelegramProvider outermost so TonConnect-restore/UI can later read viewport + safe-area via useTelegram.
import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { TonConnectUIProvider, THEME } from "@tonconnect/ui-react";
import { resolveManifestUrl } from "@/lib/ton/manifest";
import { makeQueryClient } from "@/lib/query/client";
import { TelegramProvider } from "@/lib/telegram";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient);
  return (
    <TelegramProvider>
      <TonConnectUIProvider
        manifestUrl={resolveManifestUrl()}
        restoreConnection
        uiPreferences={{ theme: THEME.DARK }}
      >
        <QueryClientProvider client={client}>
          {children}
        </QueryClientProvider>
      </TonConnectUIProvider>
    </TelegramProvider>
  );
}
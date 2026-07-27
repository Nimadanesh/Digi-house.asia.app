"use client";
// File responsibility: compose the client provider tree (thin).
// Order: Telegram -> Locale -> TonConnect -> Query (locale needs TG user.language_code).
import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { TonConnectUIProvider, THEME } from "@tonconnect/ui-react";
import { resolveManifestUrl } from "@/lib/ton/manifest";
import { makeQueryClient } from "@/lib/query/client";
import { TelegramProvider } from "@/lib/telegram";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient);
  return (
    <TelegramProvider>
      <LocaleProvider>
        <TonConnectUIProvider
          manifestUrl={resolveManifestUrl()}
          restoreConnection
          uiPreferences={{ theme: THEME.DARK }}
        >
          <QueryClientProvider client={client}>
            {children}
          </QueryClientProvider>
        </TonConnectUIProvider>
      </LocaleProvider>
    </TelegramProvider>
  );
}
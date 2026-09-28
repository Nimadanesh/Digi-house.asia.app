"use client";
// File responsibility: compose the client provider tree (thin).
// Order: Telegram -> Locale -> TonConnect -> Auth -> Query (locale needs TG user.language_code).
// Auth sits inside TonConnect (could read wallet address later for bind) but outside Query
// (uses plain fetch, no query dependencies).
import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { TonConnectUIProvider, THEME } from "@tonconnect/ui-react";
import { resolveManifestUrl } from "@/lib/ton/manifest";
import { makeQueryClient } from "@/lib/query/client";
import { getEvmConfig } from "@/lib/evm/config";
import { TelegramProvider } from "@/lib/telegram";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { AuthProvider } from "@/lib/api/AuthProvider";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient);
  const [evmConfig] = useState(getEvmConfig);
  return (
    <TelegramProvider>
      <LocaleProvider>
        <TonConnectUIProvider
          manifestUrl={resolveManifestUrl()}
          restoreConnection
          uiPreferences={{ theme: THEME.DARK }}
        >
          <AuthProvider>
            <QueryClientProvider client={client}>
              <WagmiProvider config={evmConfig}>
                {children}
              </WagmiProvider>
            </QueryClientProvider>
          </AuthProvider>
        </TonConnectUIProvider>
      </LocaleProvider>
    </TelegramProvider>
  );
}
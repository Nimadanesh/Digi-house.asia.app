"use client";
// File responsibility: Settings bottom sheet — always subscribed for open state; never crashes.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Sheet } from "@/components/common/Sheet";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { SectionLabel } from "@/components/common/SectionLabel";
import { Toggle } from "@/components/common/Toggle";
import { WalletBadge } from "@/components/wallet/WalletBadge";
import { WalletConnectButton } from "@/components/wallet/TonConnectButton";
import { CurrencySegment } from "@/components/settings/CurrencySegment";
import { AboutLegalSheet } from "@/components/settings/AboutLegalSheet";
import { useTonConnect } from "@/hooks/useTonConnect";
import { useSettingsStore } from "@/stores/settings.store";
import { useUiStore } from "@/stores/ui.store";
import { ROUTES } from "@/lib/constants";
import { haptics } from "@/lib/telegram/haptics";
import { safeBackButton } from "@/lib/telegram/chrome";

export function SettingsSheet() {
  const router = useRouter();
  const tonc = useTonConnect();
  const open = useUiStore((s) => s.settingsOpen);
  const closeSettings = useUiStore((s) => s.closeSettings);
  const setOnboardingReplay = useUiStore((s) => s.setOnboardingReplay);
  const displayCurrency = useSettingsStore((s) => s.displayCurrency);
  const setDisplayCurrency = useSettingsStore((s) => s.setDisplayCurrency);
  const useTelegramTheme = useSettingsStore((s) => s.useTelegramTheme);
  const setUseTelegramTheme = useSettingsStore((s) => s.setUseTelegramTheme);
  const showDemoBadge = useSettingsStore((s) => s.showDemoBadge);
  const setShowDemoBadge = useSettingsStore((s) => s.setShowDemoBadge);
  const [aboutOpen, setAboutOpen] = useState(false);

  const close = useCallback(() => {
    setAboutOpen(false);
    closeSettings();
    haptics.selection();
  }, [closeSettings]);

  useEffect(() => {
    if (!open) return;
    safeBackButton.show();
    const off = safeBackButton.onClick(() => {
      if (aboutOpen) {
        setAboutOpen(false);
        haptics.selection();
        return;
      }
      close();
    });
    return () => {
      off();
      try {
        const path = typeof window !== "undefined" ? window.location.pathname : "";
        if (!path.startsWith("/property/") && path !== ROUTES.onboarding) {
          safeBackButton.hide();
        }
      } catch {
        safeBackButton.hide();
      }
    };
  }, [open, aboutOpen, close]);

  async function onDisconnect() {
    haptics.impact("medium");
    await tonc.disconnect();
  }

  function openHowItWorks() {
    haptics.selection();
    setOnboardingReplay(true);
    closeSettings();
    router.push(ROUTES.onboarding);
  }

  return (
    <>
      <Sheet open={open} onClose={close} labelledBy="settings-sheet-title">
        {open ? (
          <div className="space-y-3 pb-2" data-testid="settings-sheet">
            <h2 id="settings-sheet-title" className="text-[1.0625rem] font-semibold text-foreground">
              Settings
            </h2>

            <SectionLabel>Wallet</SectionLabel>
            <Block>
              {tonc.connected ? (
                <>
                  <Row className="!min-h-[56px]">
                    <WalletBadge />
                  </Row>
                  <Row className="!min-h-[52px]">
                    <button
                      type="button"
                      onClick={() => void onDisconnect()}
                      className="w-full py-2 text-left text-sm font-medium text-danger active:opacity-80"
                      data-testid="settings-disconnect"
                    >
                      Disconnect Wallet
                    </button>
                  </Row>
                </>
              ) : (
                <Row className="!min-h-[64px]">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">Connect a TON wallet</div>
                    <div className="text-xs text-muted-foreground">
                      Required to buy shares and receive weekly yield.
                    </div>
                  </div>
                  <WalletConnectButton />
                </Row>
              )}
            </Block>

            <SectionLabel>Preferences</SectionLabel>
            <Block>
              <Row className="!min-h-[56px]">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-foreground">Display currency</div>
                  <div className="text-xs text-muted-foreground">
                    Figures stay in USD; TON estimates show on buy
                  </div>
                </div>
                <CurrencySegment value={displayCurrency} onChange={setDisplayCurrency} />
              </Row>
              <Row className="!min-h-[56px]">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-foreground">Language</div>
                  <div className="text-xs text-muted-foreground">More languages coming soon</div>
                </div>
                <span className="text-sm text-muted-foreground">English</span>
              </Row>
              <Row className="!min-h-[56px]">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-foreground">Use Telegram theme</div>
                  <div className="text-xs text-muted-foreground">Match Telegram colors</div>
                </div>
                <Toggle
                  on={useTelegramTheme}
                  onChange={setUseTelegramTheme}
                  onHaptic={() => haptics.selection()}
                  aria-label="Use Telegram theme"
                />
              </Row>
              <Row className="!min-h-[56px]">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-foreground">Show Demo badge</div>
                  <div className="text-xs text-muted-foreground">Floating honest MVP label</div>
                </div>
                <Toggle
                  on={showDemoBadge}
                  onChange={setShowDemoBadge}
                  onHaptic={() => haptics.selection()}
                  aria-label="Show Demo badge"
                />
              </Row>
            </Block>

            <SectionLabel>Help</SectionLabel>
            <Block>
              <button
                type="button"
                onClick={openHowItWorks}
                className="flex w-full min-h-[48px] items-center gap-2 px-4 text-left active:bg-surface-2/60"
                data-testid="settings-how-it-works"
              >
                <span className="flex-1 text-sm text-foreground">How DigiHouse Works</span>
                <ChevronRight size={20} strokeWidth={1.75} className="shrink-0 text-muted-foreground" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => {
                  haptics.selection();
                  setAboutOpen(true);
                }}
                className="flex w-full min-h-[48px] items-center gap-2 border-t border-border mx-0 px-4 text-left active:bg-surface-2/60"
                data-testid="settings-about-legal"
              >
                <span className="flex-1 text-sm text-foreground">About / Legal</span>
                <ChevronRight size={20} strokeWidth={1.75} className="shrink-0 text-muted-foreground" aria-hidden />
              </button>
            </Block>

            <p className="px-1 pt-1 text-center text-[0.6875rem] text-muted-foreground" data-testid="settings-demo-badge">
              Demo mode · seed data · transactions simulated
            </p>
          </div>
        ) : null}
      </Sheet>

      <AboutLegalSheet open={aboutOpen && open} onClose={() => setAboutOpen(false)} />
    </>
  );
}

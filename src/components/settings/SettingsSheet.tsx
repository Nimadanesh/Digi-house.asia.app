"use client";
// File responsibility: Settings bottom sheet shell — body (TON/settings) mounts only while open.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Sheet } from "@/components/common/Sheet";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { SectionLabel } from "@/components/common/SectionLabel";
import { Toggle } from "@/components/common/Toggle";
import { WalletBadge } from "@/components/wallet/WalletBadge";
import { WalletConnectButton } from "@/components/wallet/TonConnectButton";
import { CurrencySegment } from "@/components/settings/CurrencySegment";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { SettingsLabelStack } from "@/components/settings/SettingsLabelStack";
import { AboutLegalSheet } from "@/components/settings/AboutLegalSheet";
import { useTonConnect } from "@/hooks/useTonConnect";
import { useSettingsStore } from "@/stores/settings.store";
import { useUiStore } from "@/stores/ui.store";
import { ROUTES } from "@/lib/constants";
import { haptics } from "@/lib/telegram/haptics";
import { safeBackButton } from "@/lib/telegram/chrome";
import { env } from "@/lib/env";
import { useAuthStore } from "@/stores/auth.store";
import { Copy, Check } from "lucide-react";

/** Preference / wallet rows: taller touch target + vertical padding for title+hint stacks. */
const SETTINGS_ROW = "!min-h-[64px] items-center py-3.5";

export function SettingsSheet() {
  const open = useUiStore((s) => s.settingsOpen);
  const closeSettings = useUiStore((s) => s.closeSettings);

  const close = useCallback(() => {
    closeSettings();
    haptics.selection();
  }, [closeSettings]);

  return (
    <Sheet open={open} onClose={close} labelledBy="settings-sheet-title">
      {open ? <SettingsSheetBody onClose={close} /> : null}
    </Sheet>
  );
}

function SettingsSheetBody({ onClose }: { onClose: () => void }) {
  const t = useTranslations("settings");
  const router = useRouter();
  const tonc = useTonConnect();
  const setOnboardingReplay = useUiStore((s) => s.setOnboardingReplay);
  const displayCurrency = useSettingsStore((s) => s.displayCurrency);
  const setDisplayCurrency = useSettingsStore((s) => s.setDisplayCurrency);
  const useTelegramTheme = useSettingsStore((s) => s.useTelegramTheme);
  const setUseTelegramTheme = useSettingsStore((s) => s.setUseTelegramTheme);
  const showDemoBadge = useSettingsStore((s) => s.showDemoBadge);
  const setShowDemoBadge = useSettingsStore((s) => s.setShowDemoBadge);
  const [aboutOpen, setAboutOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);

  const closeAll = useCallback(() => {
    setAboutOpen(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    safeBackButton.show();
    const off = safeBackButton.onClick(() => {
      if (aboutOpen) {
        setAboutOpen(false);
        haptics.selection();
        return;
      }
      closeAll();
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
  }, [aboutOpen, closeAll]);

  async function onDisconnect() {
    haptics.impact("medium");
    await tonc.disconnect();
  }

  function openHowItWorks() {
    haptics.selection();
    setOnboardingReplay(true);
    onClose();
    router.push(ROUTES.onboarding);
  }

  async function onInviteFriends() {
    haptics.selection();
    if (!env.botUsername || !user) return;
    const link = `https://t.me/${env.botUsername}?startapp=ref_${user.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for privacy-restricted contexts — silently ignore
    }
  }

  return (
    <>
      <div className="space-y-5 pb-4" data-testid="settings-sheet">
        <h2
          id="settings-sheet-title"
          className="text-[1.0625rem] font-semibold leading-snug text-foreground"
        >
          {t("title")}
        </h2>

        <section className="space-y-2">
          <SectionLabel className="px-0.5">{t("wallet")}</SectionLabel>
          <Block>
            {tonc.connected ? (
              <>
                <Row className={SETTINGS_ROW}>
                  <WalletBadge />
                </Row>
                <Row className="!min-h-[52px] py-2.5">
                  <button
                    type="button"
                    onClick={() => void onDisconnect()}
                    className="w-full py-1.5 text-start text-sm font-medium text-danger active:opacity-80"
                    data-testid="settings-disconnect"
                  >
                    {t("disconnect")}
                  </button>
                </Row>
              </>
            ) : (
              <Row className={SETTINGS_ROW}>
                <SettingsLabelStack title={t("connectTitle")} hint={t("connectHint")} />
                <WalletConnectButton />
              </Row>
            )}
          </Block>
        </section>

        <section className="space-y-2">
          <SectionLabel className="px-0.5">{t("preferences")}</SectionLabel>
          <Block>
            <Row className={SETTINGS_ROW}>
              <SettingsLabelStack
                title={t("displayCurrency")}
                hint={t("displayCurrencyHint")}
              />
              <CurrencySegment value={displayCurrency} onChange={setDisplayCurrency} />
            </Row>
            <div className="border-t border-border">
              <LanguageSelector />
            </div>
            <Row className={SETTINGS_ROW}>
              <SettingsLabelStack
                title={t("useTelegramTheme")}
                hint={t("useTelegramThemeHint")}
              />
              <Toggle
                on={useTelegramTheme}
                onChange={setUseTelegramTheme}
                onHaptic={() => haptics.selection()}
                aria-label={t("useTelegramTheme")}
              />
            </Row>
            <Row className={SETTINGS_ROW}>
              <SettingsLabelStack
                title={t("showDemoBadge")}
                hint={t("showDemoBadgeHint")}
              />
              <Toggle
                on={showDemoBadge}
                onChange={setShowDemoBadge}
                onHaptic={() => haptics.selection()}
                aria-label={t("showDemoBadge")}
              />
            </Row>
          </Block>
        </section>

        <section className="space-y-2">
          <SectionLabel className="px-0.5">Referrals</SectionLabel>
          <Block>
            <button
              type="button"
              onClick={() => void onInviteFriends()}
              className="flex w-full min-h-[56px] items-center gap-2 px-4 py-3.5 text-start active:bg-surface-2/60"
              data-testid="settings-invite-friends"
              disabled={!env.botUsername}
            >
              <span className="flex-1 text-sm font-medium leading-snug text-foreground">
                {copied ? "Copied!" : "Invite friends"}
              </span>
              {copied ? (
                <Check size={20} strokeWidth={1.75} className="shrink-0 text-success" aria-hidden />
              ) : (
                <Copy size={20} strokeWidth={1.75} className="shrink-0 text-muted-foreground" aria-hidden />
              )}
            </button>
          </Block>
        </section>

        <section className="space-y-2">
          <SectionLabel className="px-0.5">{t("help")}</SectionLabel>
          <Block>
            <button
              type="button"
              onClick={openHowItWorks}
              className="flex w-full min-h-[56px] items-center gap-2 px-4 py-3.5 text-start active:bg-surface-2/60"
              data-testid="settings-how-it-works"
            >
              <span className="flex-1 text-sm font-medium leading-snug text-foreground">
                {t("howItWorks")}
              </span>
              <ChevronRight
                size={20}
                strokeWidth={1.75}
                className="shrink-0 text-muted-foreground rtl:rotate-180"
                aria-hidden
              />
            </button>
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                setAboutOpen(true);
              }}
              className="flex w-full min-h-[56px] items-center gap-2 border-t border-border px-4 py-3.5 text-start active:bg-surface-2/60"
              data-testid="settings-about-legal"
            >
              <span className="flex-1 text-sm font-medium leading-snug text-foreground">
                {t("aboutLegal")}
              </span>
              <ChevronRight
                size={20}
                strokeWidth={1.75}
                className="shrink-0 text-muted-foreground rtl:rotate-180"
                aria-hidden
              />
            </button>
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                closeAll();
                router.push(ROUTES.transactions);
              }}
              className="flex w-full min-h-[56px] items-center gap-2 border-t border-border px-4 py-3.5 text-start active:bg-surface-2/60"
              data-testid="settings-transaction-history"
            >
              <span className="flex-1 text-sm font-medium leading-snug text-foreground">
                Transaction history
              </span>
              <ChevronRight
                size={20}
                strokeWidth={1.75}
                className="shrink-0 text-muted-foreground rtl:rotate-180"
                aria-hidden
              />
            </button>
          </Block>
        </section>

        <p
          className="px-2 pt-1 pb-1 text-center text-[0.6875rem] leading-relaxed text-muted-foreground"
          data-testid="settings-demo-badge"
        >
          {t("demoFooter")}
        </p>
      </div>

      <AboutLegalSheet open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}

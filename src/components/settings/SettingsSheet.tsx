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
import { SettingsProfileSection } from "@/components/settings/SettingsProfileSection";
import { useTonConnect } from "@/hooks/useTonConnect";
import { useSettingsStore } from "@/stores/settings.store";
import { useUiStore } from "@/stores/ui.store";
import { useApiAuth } from "@/hooks/useApiAuth";
import { ROUTES } from "@/lib/constants";
import { haptics } from "@/lib/telegram/haptics";
import { safeBackButton } from "@/lib/telegram/chrome";
import { env } from "@/lib/env";
import { useAuthStore } from "@/stores/auth.store";
import { setApiAccessToken } from "@/lib/api/session-token";
import { triggerAuthInvalidated } from "@/lib/api/auth-events";
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
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const { reauthenticate } = useApiAuth();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);

  const closeAll = useCallback(() => {
    setAboutOpen(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    safeBackButton.show();
    const off = safeBackButton.onClick(() => {
      if (signOutOpen) {
        setSignOutOpen(false);
        haptics.selection();
        return;
      }
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
  }, [aboutOpen, signOutOpen, closeAll]);

  async function onDisconnect() {
    haptics.impact("medium");
    await tonc.disconnect();
  }

  function onSignOut() {
    haptics.impact("medium");
    setSignOutOpen(false);
    setApiAccessToken(null);
    triggerAuthInvalidated();
    setOnboarded(false);
    onClose();
    router.replace(ROUTES.onboarding);
    void reauthenticate();
  }

  function onSignOutCancel() {
    haptics.selection();
    setSignOutOpen(false);
  }

  function openHowItWorks() {
    haptics.selection();
    setOnboardingReplay(true);
    onClose();
    router.push(ROUTES.onboarding);
  }

  const canInvite = Boolean(env.botUsername && user?.id);

  async function onInviteFriends() {
    haptics.selection();
    if (!env.botUsername || !user?.id) return;
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

        <SettingsProfileSection />

        {!user ? (
          <section className="space-y-2">
            <SectionLabel className="px-0.5">{t("account")}</SectionLabel>
            <Block>
              <button
                type="button"
                onClick={() => {
                  haptics.selection();
                  onClose();
                  router.push(ROUTES.recoveryLogin);
                }}
                className="flex w-full min-h-[56px] items-center gap-2 px-4 py-3.5 text-start active:bg-surface-2/60"
                data-testid="settings-recovery-login"
              >
                <span className="flex-1 text-sm font-medium leading-snug text-foreground">
                  {t("recoverySignIn")}
                </span>
                <ChevronRight
                  size={20}
                  strokeWidth={1.75}
                  className="shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </button>
            </Block>
          </section>
        ) : null}

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
          </Block>
        </section>

        <section className="space-y-2">
          <SectionLabel className="px-0.5">Referrals</SectionLabel>
          <Block>
            <button
              type="button"
              onClick={() => void onInviteFriends()}
              className="flex w-full min-h-[56px] items-center gap-2 px-4 py-3.5 text-start active:bg-surface-2/60 disabled:opacity-50 disabled:pointer-events-none"
              data-testid="settings-invite-friends"
              disabled={!canInvite}
              aria-disabled={!canInvite}
            >
              <span className="flex-1 text-sm font-medium leading-snug text-foreground">
                {copied ? "Copied!" : !user?.id ? "Sign in to invite" : "Invite friends"}
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

        <section className="space-y-2">
          <SectionLabel className="px-0.5">{t("signOut")}</SectionLabel>
          <Block>
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                setSignOutOpen(true);
              }}
              className="flex w-full min-h-[56px] items-center gap-2 px-4 py-3.5 text-start active:bg-surface-2/60"
              data-testid="settings-sign-out"
            >
              <span className="flex-1 text-sm font-medium leading-snug text-danger">
                {t("signOut")}
              </span>
              <ChevronRight
                size={20}
                strokeWidth={1.75}
                className="shrink-0 text-danger rtl:rotate-180"
                aria-hidden
              />
            </button>
          </Block>
        </section>

      </div>

      <AboutLegalSheet open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <SignOutConfirmSheet
        open={signOutOpen}
        onConfirm={onSignOut}
        onCancel={onSignOutCancel}
      />
    </>
  );
}

function SignOutConfirmSheet({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("settings");
  const tp = useTranslations("profile");

  return (
    <Sheet
      open={open}
      onClose={onCancel}
      labelledBy="sign-out-confirm-title"
      className="max-h-[85svh]"
    >
      <div className="space-y-4 pb-3" data-testid="sign-out-confirm">
        <h2
          id="sign-out-confirm-title"
          className="text-[1.0625rem] font-semibold leading-snug text-foreground"
        >
          {t("signOutConfirmTitle")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("signOutConfirmBody")}
        </p>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 flex-1 rounded-[12px] bg-surface-2 text-sm font-medium text-foreground"
            data-testid="sign-out-confirm-cancel"
          >
            {tp("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 flex-1 rounded-[12px] bg-primary text-sm font-semibold text-primary-foreground"
            data-testid="sign-out-confirm-submit"
          >
            {t("signOut")}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

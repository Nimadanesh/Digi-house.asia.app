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
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { SettingsLabelStack } from "@/components/settings/SettingsLabelStack";
import { AboutLegalSheet } from "@/components/settings/AboutLegalSheet";
import { SettingsProfileSection } from "@/components/settings/SettingsProfileSection";
import { WithdrawalAddressesSection } from "@/components/settings/WithdrawalAddressesSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { useTonConnect } from "@/hooks/useTonConnect";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { useSettingsStore } from "@/stores/settings.store";
import { useUiStore } from "@/stores/ui.store";
import { useApiAuth } from "@/hooks/useApiAuth";
import { ROUTES } from "@/lib/constants";
import { haptics } from "@/lib/telegram/haptics";
import { safeBackButton } from "@/lib/telegram/chrome";
import { closeTopSheet } from "@/components/common/Sheet";
import { useAuthStore } from "@/stores/auth.store";
import { setApiAccessToken } from "@/lib/api/session-token";
import { triggerAuthInvalidated } from "@/lib/api/auth-events";

/** Preference / wallet rows: taller touch target + vertical padding for title+hint stacks. */
const SETTINGS_ROW = "!min-h-[64px] items-center py-3.5";
/** Nav/action rows: press feedback = bg tint + scale (matches the Settings edit rows). */
const NAV_ROW = "active:bg-surface-2/60 active:scale-[0.98] transition-transform duration-[120ms] ease-out";

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
  const evm = useEvmWallet();
  const setOnboardingReplay = useUiStore((s) => s.setOnboardingReplay);
  const useTelegramTheme = useSettingsStore((s) => s.useTelegramTheme);
  const setUseTelegramTheme = useSettingsStore((s) => s.setUseTelegramTheme);
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const { reauthenticate } = useApiAuth();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const user = useAuthStore((s) => s.user);

  const closeAll = useCallback(() => {
    setAboutOpen(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    safeBackButton.show();
    const off = safeBackButton.onClick(() => {
      // Unified stack: Back closes the topmost dismissible sheet (sign-out, about/legal,
      // language picker) — falling through to
      // Settings itself only when no nested sheet is open.
      if (closeTopSheet()) return;
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
  }, [closeAll]);

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

  return (
    <>
      <div className="space-y-6 pb-6" data-testid="settings-sheet">
        <h2
          id="settings-sheet-title"
          className="pt-1 text-[1.0625rem] font-semibold leading-snug text-foreground"
        >
          {t("title")}
        </h2>

        {/* 1–2. Profile + Security */}
        <SettingsProfileSection />

        {!user ? (
          <section className="space-y-2.5">
            <SectionLabel className="px-0.5">{t("account")}</SectionLabel>
            <Block>
              <button
                type="button"
                onClick={() => {
                  haptics.selection();
                  onClose();
                  router.push(ROUTES.recoveryLogin);
                }}
                className={`flex w-full min-h-[56px] items-center gap-2 px-4 py-3.5 text-start ${NAV_ROW}`}
                data-testid="settings-recovery-login"
              >
                <span className="flex-1 text-sm font-medium leading-snug text-foreground">
                  {t("recoverySignIn")}
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
        ) : null}

        {/* 3. Wallet status (read-only — connect/disconnect live in the chooser) */}
        <section className="space-y-2.5">
          <SectionLabel className="px-0.5">{t("wallet")}</SectionLabel>
          <Block>
            {evm.connected && evm.address ? (
              <Row className={SETTINGS_ROW} data-testid="settings-evm-status">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm tnum text-foreground">
                    {evm.short}
                  </p>
                  <p className="mt-0.5 truncate text-[0.6875rem] text-muted-foreground">
                    {evm.chainName ?? ""}
                  </p>
                </div>
                <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden />
              </Row>
            ) : null}
            {tonc.connected ? (
              <Row className={SETTINGS_ROW} data-testid="settings-ton-status">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm tnum text-foreground">
                    {tonc.short}
                  </p>
                  <p className="mt-0.5 truncate text-[0.6875rem] uppercase text-muted-foreground">
                    {tonc.network}
                  </p>
                </div>
                <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden />
              </Row>
            ) : null}
            {!evm.connected && !tonc.connected ? (
              <Row className="!min-h-[56px]">
                <span className="text-sm text-muted-foreground" data-testid="settings-wallet-empty">
                  {t("connectHint")}
                </span>
              </Row>
            ) : null}
            {evm.connecting ? (
              <Row className="!min-h-[52px] py-2.5">
                <span className="text-sm text-muted-foreground" data-testid="settings-evm-connecting">
                  {evm.connectingTo
                    ? t("evmConnectingTo", { name: evm.connectingTo })
                    : t("evmConnecting")}
                </span>
              </Row>
            ) : null}
            {evm.error ? (
              <Row className="!min-h-[52px] py-2.5">
                <span className="text-sm text-danger" data-testid="settings-evm-error">
                  {evm.error === "setup" ? t("evmSetupNeeded") : t("evmConnectFailed")}
                </span>
              </Row>
            ) : null}
          </Block>
        </section>

        {/* 4. Withdrawal addresses (account primary + local book; no financial activity) */}
        <WithdrawalAddressesSection />

        {/* 5. Preferences (language + theme; no currency switcher) */}
        <section className="space-y-2.5">
          <SectionLabel className="px-0.5">{t("preferences")}</SectionLabel>
          <Block>
            <LanguageSelector />
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

        {/* 6. Notifications */}
        <NotificationsSection />

        {/* 7. Help & Legal (+ link-only transaction history) */}
        <section className="space-y-2.5">
          <SectionLabel className="px-0.5">{t("help")}</SectionLabel>
          <Block>
            <button
              type="button"
              onClick={openHowItWorks}
              className={`flex w-full min-h-[56px] items-center gap-2 px-4 py-3.5 text-start ${NAV_ROW}`}
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
              className={`flex w-full min-h-[56px] items-center gap-2 border-t border-border px-4 py-3.5 text-start ${NAV_ROW}`}
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
              className={`flex w-full min-h-[56px] items-center gap-2 border-t border-border px-4 py-3.5 text-start ${NAV_ROW}`}
              data-testid="settings-transaction-history"
            >
              <span className="flex-1 text-sm font-medium leading-snug text-foreground">
                {t("transactionHistory")}
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

        {/* 8. Sign out (always confirmed) */}
        <section className="space-y-2.5">
          <SectionLabel className="px-0.5">{t("signOut")}</SectionLabel>
          <Block>
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                setSignOutOpen(true);
              }}
              className={`flex w-full min-h-[56px] items-center gap-2 px-4 py-3.5 text-start ${NAV_ROW}`}
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
            className="h-11 flex-1 rounded-[12px] bg-surface-2 text-sm font-medium text-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out"
            data-testid="sign-out-confirm-cancel"
          >
            {tp("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 flex-1 rounded-[12px] bg-primary text-sm font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out"
            data-testid="sign-out-confirm-submit"
          >
            {t("signOut")}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

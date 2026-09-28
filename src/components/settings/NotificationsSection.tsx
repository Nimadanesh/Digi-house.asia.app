"use client";
// File responsibility: Settings notifications — three simple local-only toggles.
import { useTranslations } from "next-intl";
import { Row } from "@/components/common/Row";
import { Toggle } from "@/components/common/Toggle";
import { SettingsLabelStack } from "@/components/settings/SettingsLabelStack";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { useSettingsStore, type NotificationPrefs } from "@/stores/settings.store";
import { haptics } from "@/lib/telegram/haptics";

const ROWS: {
  key: keyof NotificationPrefs;
  titleKey: "notifPayout" | "notifWithdrawal" | "notifMarket";
  hintKey: "notifPayoutHint" | "notifWithdrawalHint" | "notifMarketHint";
  testId: string;
}[] = [
  { key: "payoutReceived", titleKey: "notifPayout", hintKey: "notifPayoutHint", testId: "notif-payout" },
  { key: "withdrawalUpdates", titleKey: "notifWithdrawal", hintKey: "notifWithdrawalHint", testId: "notif-withdrawal" },
  { key: "marketAlerts", titleKey: "notifMarket", hintKey: "notifMarketHint", testId: "notif-market" },
];

export function NotificationsSection() {
  const t = useTranslations("settings");
  const notifications = useSettingsStore((s) => s.notifications);
  const setNotification = useSettingsStore((s) => s.setNotification);

  return (
    <SettingsSection label={t("notifications")} testId="settings-notifications">
      {ROWS.map((r) => (
        <Row key={r.key} className="!min-h-[64px] items-center py-3.5">
          <SettingsLabelStack title={t(r.titleKey)} hint={t(r.hintKey)} />
          <Toggle
            on={notifications[r.key]}
            onChange={(v) => setNotification(r.key, v)}
            onHaptic={() => haptics.selection()}
            aria-label={t(r.titleKey)}
          />
        </Row>
      ))}
    </SettingsSection>
  );
}

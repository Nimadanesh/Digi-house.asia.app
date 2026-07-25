"use client";
// File responsibility: Settings screen — wallet / appearance (theme toggle) / about, with the honesty
// disclaimer rendered exactly once (MVP payout contract). Wired through sanctioned hooks + stores only.
import { useTonConnect } from "@/hooks/useTonConnect";
import { useSettingsStore } from "@/stores/settings.store";
import { PAYOUT_DISCLAIMER } from "@/lib/constants";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { SectionLabel } from "@/components/common/SectionLabel";
import { Toggle } from "@/components/common/Toggle";
import { WalletConnectButton } from "@/components/wallet/TonConnectButton";
import { WalletBadge } from "@/components/wallet/WalletBadge";

export default function SettingsPage() {
  const tonc = useTonConnect();
  const useTelegramTheme = useSettingsStore((s) => s.useTelegramTheme);
  const setUseTelegramTheme = useSettingsStore((s) => s.setUseTelegramTheme);

  return (
    <div className="mt-3 space-y-3">
      <SectionLabel className="mt-2">Wallet</SectionLabel>
      <Block>
        {tonc.connected ? (
          <Row className="!min-h-[56px]">
            <WalletBadge />
          </Row>
        ) : (
          <Row className="!min-h-[64px]">
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">Connect a TON wallet</div>
              <div className="text-xs text-muted-foreground">Required to buy shares and receive weekly yield.</div>
            </div>
            <WalletConnectButton />
          </Row>
        )}
      </Block>

      <SectionLabel className="mt-2">Appearance</SectionLabel>
      <Block>
        <Row className="!min-h-[56px]">
          <div className="flex-1">
            <div className="text-sm text-foreground">Use Telegram theme</div>
            <div className="text-xs text-muted-foreground">Match the app to your Telegram color scheme.</div>
          </div>
          <Toggle on={useTelegramTheme} onChange={setUseTelegramTheme} aria-label="Use Telegram theme" />
        </Row>
      </Block>

      <SectionLabel className="mt-2">About</SectionLabel>
      <Block>
        <Row>
          <span className="text-sm text-muted-foreground">Project</span>
          <span className="ml-auto text-sm text-foreground">DigiHouse</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">Network</span>
          <span className="ml-auto text-sm text-foreground uppercase">{tonc.network}</span>
        </Row>
      </Block>

      <p className="text-xs text-muted-foreground">{PAYOUT_DISCLAIMER}</p>
    </div>
  );
}
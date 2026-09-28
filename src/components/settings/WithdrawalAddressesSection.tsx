"use client";
// File responsibility: Settings withdrawal addresses — account primary (edit/copy +
// network) + local address book (add with network dropdown / delete / promote to
// primary). Verification is honest: only the account's own verified primary ever
// shows Verified; book entries show Not verified.
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Check, Copy, Pencil, ChevronDown } from "lucide-react";
import { Row } from "@/components/common/Row";
import { StatusPill } from "@/components/common/StatusPill";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { AddressRow, NetworkPill } from "@/components/settings/WithdrawalAddressRow";
import { useAuthStore } from "@/stores/auth.store";
import { useSettingsStore, type BookAddress } from "@/stores/settings.store";
import { useWithdrawalAddress } from "@/hooks/useWithdrawalAddress";
import {
  PAYOUT_NETWORKS,
  detectNetwork,
  isValidAddressForNetwork,
  type PayoutNetwork,
} from "@/lib/addresses";
import { shortAddr } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

const FIELD =
  "flex h-11 w-full items-center rounded-[10px] bg-surface-2 px-3 text-[0.9375rem] text-foreground outline-none placeholder:text-muted-foreground";

export function WithdrawalAddressesSection() {
  const t = useTranslations("settings");
  const user = useAuthStore((s) => s.user);
  const book = useSettingsStore((s) => s.addressBook);
  const addBookAddress = useSettingsStore((s) => s.addBookAddress);
  const removeBookAddress = useSettingsStore((s) => s.removeBookAddress);
  const { saveAddress, pending } = useWithdrawalAddress();
  const [adding, setAdding] = useState(false);
  const [editingPrimary, setEditingPrimary] = useState(false);
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState<PayoutNetwork>("ethereum");
  const [primaryDraft, setPrimaryDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onAdd = useCallback(async () => {
    setErr(null);
    const value = address.trim();
    if (!isValidAddressForNetwork(value, network)) {
      setErr(t("withdrawalInvalid"));
      return;
    }
    haptics.impact("medium");
    addBookAddress(value, network);
    setAddress("");
    setAdding(false);
  }, [address, network, addBookAddress, t]);

  const onUse = useCallback(
    async (entry: BookAddress) => {
      setErr(null);
      try {
        haptics.impact("medium");
        await saveAddress(entry.address);
      } catch (e) {
        setErr(e instanceof Error ? e.message : t("withdrawalInvalid"));
      }
    },
    [saveAddress, t],
  );

  const onSavePrimary = useCallback(async () => {
    setErr(null);
    const value = primaryDraft.trim();
    if (!isValidAddressForNetwork(value, "ton")) {
      setErr(t("withdrawalInvalid"));
      return;
    }
    try {
      haptics.impact("medium");
      await saveAddress(value);
      setEditingPrimary(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("withdrawalInvalid"));
    }
  }, [primaryDraft, saveAddress, t]);

  const onCopy = useCallback(async (value: string) => {
    haptics.selection();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  if (!user) return null;
  const primary = user.withdrawalAddress;
  const primaryNetwork: PayoutNetwork = primary ? detectNetwork(primary) : "ton";
  const extras = book.filter((e) => e.address !== primary);

  return (
    <SettingsSection label={t("addresses")} testId="settings-addresses">
      {primary ? (
        editingPrimary ? (
          <div className="space-y-3 p-3" data-testid="settings-primary-form">
            <input
              type="text"
              value={primaryDraft}
              onChange={(e) => setPrimaryDraft(e.target.value)}
              className={FIELD}
              placeholder={t("withdrawalPlaceholder")}
              data-testid="settings-primary-input"
            />
            {err ? <p className="text-sm text-danger">{err}</p> : null}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingPrimary(false)}
                className="h-11 flex-1 rounded-[12px] bg-surface-2 text-sm font-medium text-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out"
                data-testid="settings-primary-cancel"
              >
                {t("withdrawalCancel")}
              </button>
              <button
                type="button"
                onClick={() => void onSavePrimary()}
                disabled={pending}
                className="h-11 flex-1 rounded-[12px] bg-primary text-sm font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-50"
                data-testid="settings-primary-save"
              >
                {t("withdrawalSave")}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3.5" data-testid="settings-primary-row">
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate font-mono text-sm tnum text-foreground">
                {shortAddr(primary, { prefix: 6, suffix: 6 })}
              </p>
              <button
                type="button"
                onClick={() => {
                  haptics.selection();
                  setPrimaryDraft(primary);
                  setErr(null);
                  setEditingPrimary(true);
                }}
                aria-label={t("addressEdit")}
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-primary active:scale-[0.97] transition-transform duration-[120ms] ease-out"
                data-testid="settings-primary-edit"
              >
                <Pencil size={18} strokeWidth={1.75} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => void onCopy(primary)}
                aria-label={t("addressCopy")}
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-primary active:scale-[0.97] transition-transform duration-[120ms] ease-out"
                data-testid="settings-primary-copy"
              >
                {copied ? (
                  <Check size={18} strokeWidth={1.75} className="text-success" aria-hidden />
                ) : (
                  <Copy size={18} strokeWidth={1.75} aria-hidden />
                )}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <NetworkPill network={primaryNetwork} />
              <StatusPill
                label={
                  user.withdrawalAddressVerified
                    ? t("withdrawalVerified")
                    : t("withdrawalUnverified")
                }
                variant={user.withdrawalAddressVerified ? "success" : "warning"}
              />
              <span className="inline-flex items-center gap-0.5 text-[0.6875rem] text-muted-foreground">
                <Check size={12} strokeWidth={2} aria-hidden />
                {t("addressPrimary")}
              </span>
            </div>
            {err && !adding ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
          </div>
        )
      ) : (
        <Row className="!min-h-[56px]">
          <span className="text-sm text-muted-foreground">{t("withdrawalEmpty")}</span>
        </Row>
      )}
      {extras.map((e) => (
        <AddressRow
          key={e.address}
          entry={e}
          onDelete={() => {
            haptics.selection();
            removeBookAddress(e.address);
          }}
          onUse={() => void onUse(e)}
          using={pending}
        />
      ))}
      {!adding ? (
        <button
          type="button"
          onClick={() => {
            haptics.selection();
            setAddress("");
            setNetwork("ethereum");
            setErr(null);
            setAdding(true);
          }}
          className="flex w-full min-h-[56px] items-center gap-2 px-4 py-3.5 text-start active:bg-surface-2/60 active:scale-[0.98] transition-transform duration-[120ms] ease-out"
          data-testid="settings-address-add"
        >
          <span className="flex-1 text-sm font-medium text-foreground">{t("addressAdd")}</span>
          <Plus size={20} strokeWidth={1.75} className="shrink-0 text-primary" aria-hidden />
        </button>
      ) : (
        <div className="space-y-3 p-3" data-testid="settings-address-form">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={FIELD}
            placeholder={t("withdrawalPlaceholder")}
            data-testid="settings-address-input"
          />
          <label className="block">
            <span className="mb-1.5 block text-[0.6875rem] font-medium text-muted-foreground">
              {t("network")}
            </span>
            <span className="relative block">
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value as PayoutNetwork)}
                className={cn(FIELD, "appearance-none pr-10")}
                data-testid="settings-address-network"
              >
                {PAYOUT_NETWORKS.map((n) => (
                  <option key={n} value={n}>
                    {
                      {
                        ton: t("netTon"),
                        ethereum: t("netEthereum"),
                        tron: t("netTron"),
                        bnb: t("netBnb"),
                        polygon: t("netPolygon"),
                        arbitrum: t("netArbitrum"),
                      }[n]
                    }
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                strokeWidth={1.75}
                aria-hidden
                className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </span>
          </label>
          <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
            {t("withdrawalHint")}
          </p>
          {err ? <p className="text-sm text-danger">{err}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="h-11 flex-1 rounded-[12px] bg-surface-2 text-sm font-medium text-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out"
              data-testid="settings-address-cancel"
            >
              {t("withdrawalCancel")}
            </button>
            <button
              type="button"
              onClick={() => void onAdd()}
              className="h-11 flex-1 rounded-[12px] bg-primary text-sm font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out"
              data-testid="settings-address-save"
            >
              {t("withdrawalSave")}
            </button>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}

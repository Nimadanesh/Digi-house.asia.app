"use client";
// File responsibility: Settings — USDT withdrawal address block (PE-01). Row pattern:
// saved address + verified pill, tap to edit inline (same pattern as the profile edit).
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";
import { Block } from "@/components/common/Block";
import { SectionLabel } from "@/components/common/SectionLabel";
import { StatusPill } from "@/components/common/StatusPill";
import { useAuthStore } from "@/stores/auth.store";
import { useWithdrawalAddress } from "@/hooks/useWithdrawalAddress";
import { shortAddr } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";

const FIELD =
  "flex h-11 w-full items-center rounded-[10px] bg-surface-2 px-3 text-[0.9375rem] text-foreground outline-none placeholder:text-muted-foreground";

/** Loose client-side shape check; the API does the authoritative @ton/core parse. */
function looksLikeTonAddress(value: string): boolean {
  const s = value.trim();
  return (
    (s.startsWith("EQ") || s.startsWith("UQ") || s.startsWith("0:")) &&
    s.length >= 20
  );
}

export function WithdrawalAddressSection() {
  const t = useTranslations("settings");
  const user = useAuthStore((s) => s.user);
  const { saveAddress, pending } = useWithdrawalAddress();
  const [editing, setEditing] = useState(false);
  const [address, setAddress] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const openEdit = useCallback(() => {
    haptics.selection();
    setAddress(user?.withdrawalAddress ?? "");
    setErr(null);
    setEditing(true);
  }, [user?.withdrawalAddress]);

  const onSave = useCallback(async () => {
    setErr(null);
    const value = address.trim();
    if (!looksLikeTonAddress(value)) {
      setErr(t("withdrawalInvalid"));
      return;
    }
    try {
      haptics.impact("medium");
      await saveAddress(value);
      setEditing(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("withdrawalInvalid"));
    }
  }, [address, saveAddress, t]);

  if (!user) return null;

  return (
    <section className="space-y-2">
      <SectionLabel className="px-0.5">{t("withdrawals")}</SectionLabel>
      <Block>
        {!editing ? (
          <button
            type="button"
            onClick={openEdit}
            className="flex w-full min-h-[56px] items-center gap-2 px-4 py-3.5 text-start active:bg-surface-2/60 active:scale-[0.98] transition-transform duration-[120ms] ease-out"
            data-testid="settings-withdrawal-edit"
          >
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">
                {t("withdrawalTitle")}
              </span>
              <span className="text-[0.8125rem] text-muted-foreground">
                {user.withdrawalAddress ? (
                  <span className="font-mono tnum">
                    {shortAddr(user.withdrawalAddress, { prefix: 6, suffix: 6 })}
                  </span>
                ) : (
                  t("withdrawalEmpty")
                )}
              </span>
            </span>
            <StatusPill
              label={
                user.withdrawalAddressVerified
                  ? t("withdrawalVerified")
                  : t("withdrawalUnverified")
              }
              variant={user.withdrawalAddressVerified ? "success" : "warning"}
            />
            <Pencil
              size={20}
              strokeWidth={1.75}
              className="shrink-0 text-muted-foreground"
              aria-hidden
            />
          </button>
        ) : (
          <div className="space-y-3 p-3" data-testid="settings-withdrawal-form">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={FIELD}
              placeholder={t("withdrawalPlaceholder")}
              data-testid="settings-withdrawal-address"
            />
            <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
              {t("withdrawalHint")}
            </p>
            {err ? <p className="text-sm text-danger">{err}</p> : null}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="h-11 flex-1 rounded-[12px] bg-surface-2 text-sm font-medium text-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out"
                data-testid="settings-withdrawal-cancel"
              >
                {t("withdrawalCancel")}
              </button>
              <button
                type="button"
                onClick={() => void onSave()}
                disabled={pending}
                className="h-11 flex-1 rounded-[12px] bg-primary text-sm font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-50"
                data-testid="settings-withdrawal-save"
              >
                {t("withdrawalSave")}
              </button>
            </div>
          </div>
        )}
      </Block>
    </section>
  );
}

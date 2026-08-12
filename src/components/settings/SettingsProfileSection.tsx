"use client";
// File responsibility: Settings profile + recovery code block (name/phone edit, copy code).
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Eye, EyeOff, Pencil } from "lucide-react";
import { Block } from "@/components/common/Block";
import { SectionLabel } from "@/components/common/SectionLabel";
import { useAuthStore } from "@/stores/auth.store";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { useRecoveryCode } from "@/hooks/useRecoveryCode";
import {
  normalizeDisplayNameInput,
  normalizePhoneInput,
} from "@/lib/profile";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

const FIELD =
  "flex h-11 w-full items-center rounded-[10px] bg-surface-2 px-3 text-[0.9375rem] text-foreground outline-none placeholder:text-muted-foreground";

export function SettingsProfileSection() {
  const t = useTranslations("profile");
  const user = useAuthStore((s) => s.user);
  const { updateProfile, pending } = useUpdateProfile();
  const { code, loading: codeLoading } = useRecoveryCode();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const openEdit = useCallback(() => {
    haptics.selection();
    setDisplayName(user?.displayName ?? "");
    setPhone(user?.phone ?? "");
    setErr(null);
    setEditing(true);
  }, [user?.displayName, user?.phone]);

  const onSave = useCallback(async () => {
    setErr(null);
    const name = normalizeDisplayNameInput(displayName);
    if (!name) {
      setErr(t("errors.name"));
      return;
    }
    const phoneNorm = normalizePhoneInput(phone);
    if (phoneNorm === "invalid") {
      setErr(t("errors.phone"));
      return;
    }
    try {
      haptics.impact("medium");
      await updateProfile({ displayName: name, phone: phoneNorm });
      setEditing(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("errors.save"));
    }
  }, [displayName, phone, updateProfile, t]);

  const onCopy = useCallback(async () => {
    if (!code) return;
    haptics.selection();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [code]);

  if (!user) return null;

  return (
    <>
      <section className="space-y-2">
        <SectionLabel className="px-0.5">{t("settingsSection")}</SectionLabel>
        <Block>
          {!editing ? (
            <button
              type="button"
              onClick={openEdit}
              className="flex w-full min-h-[56px] items-center gap-2 px-4 py-3.5 text-start active:bg-surface-2/60"
              data-testid="settings-profile-edit"
            >
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {user.displayName}
                </span>
                <span className="text-[0.8125rem] text-muted-foreground">
                  {user.phone ?? t("phoneEmpty")}
                </span>
              </span>
              <Pencil
                size={20}
                strokeWidth={1.75}
                className="shrink-0 text-muted-foreground"
                aria-hidden
              />
            </button>
          ) : (
            <div className="space-y-3 p-3" data-testid="settings-profile-form">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={FIELD}
                data-testid="settings-display-name"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={FIELD}
                placeholder={t("phonePlaceholder")}
                data-testid="settings-phone"
              />
              {err ? <p className="text-sm text-danger">{err}</p> : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="h-11 flex-1 rounded-[12px] bg-surface-2 text-sm font-medium text-foreground"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => void onSave()}
                  disabled={pending}
                  className="h-11 flex-1 rounded-[12px] bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  data-testid="settings-profile-save"
                >
                  {t("save")}
                </button>
              </div>
            </div>
          )}
        </Block>
      </section>

      <section className="space-y-2">
        <SectionLabel className="px-0.5">{t("recoveryTitle")}</SectionLabel>
        <Block className="p-4">
          <p className="mb-3 text-[0.8125rem] text-muted-foreground">
            {t("recoverySettingsHint")}
          </p>
          <div
            className={cn(
              "flex items-center gap-2 rounded-[10px] bg-surface-2 px-3 py-3",
            )}
            data-testid="settings-recovery-code"
          >
            <span className="flex-1 font-mono text-[0.9375rem] font-semibold tracking-wide text-foreground tnum">
              {codeLoading ? "····" : code == null ? "—" : revealed ? code : "••••••••"}
            </span>
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                setRevealed((r) => !r);
              }}
              disabled={!code}
              className="flex size-10 items-center justify-center rounded-full text-primary active:scale-[0.97] disabled:opacity-40"
              aria-label={revealed ? t("hideCode") : t("showCode")}
              data-testid="settings-toggle-code"
            >
              {revealed ? (
                <EyeOff size={20} strokeWidth={1.75} />
              ) : (
                <Eye size={20} strokeWidth={1.75} />
              )}
            </button>
            <button
              type="button"
              onClick={() => void onCopy()}
              disabled={!code}
              className="flex size-10 items-center justify-center rounded-full text-primary active:scale-[0.97] disabled:opacity-40"
              aria-label={t("copyCode")}
              data-testid="settings-copy-code"
            >
              {copied ? (
                <Check size={20} strokeWidth={1.75} className="text-success" />
              ) : (
                <Copy size={20} strokeWidth={1.75} />
              )}
            </button>
          </div>
        </Block>
      </section>
    </>
  );
}

"use client";
// File responsibility: light profile setup — name, phone, recovery code confirm.
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { Block } from "@/components/common/Block";
import { SectionLabel } from "@/components/common/SectionLabel";
import { useAuthStore } from "@/stores/auth.store";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { useRecoveryCode } from "@/hooks/useRecoveryCode";
import { useRequestTelegramContact } from "@/hooks/useRequestTelegramContact";
import { useTelegramUser } from "@/hooks/useTelegramUser";
import {
  normalizeDisplayNameInput,
  normalizePhoneInput,
} from "@/lib/profile";
import { haptics } from "@/lib/telegram/haptics";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const FIELD =
  "flex h-11 w-full items-center rounded-[10px] bg-surface-2 px-3 text-[0.9375rem] text-foreground outline-none placeholder:text-muted-foreground";

export function ProfileSetupForm() {
  const t = useTranslations("profile");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { firstName } = useTelegramUser();
  const { updateProfile, pending, error } = useUpdateProfile();
  const { code, loading: codeLoading } = useRecoveryCode();
  const { available: contactAvailable, requesting, requestPhone } =
    useRequestTelegramContact();

  const prefillName =
    user?.displayName?.trim() || firstName || "";

  const [displayName, setDisplayName] = useState(
    prefillName === "there" ? "" : prefillName,
  );
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [savedCode, setSavedCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [syncedName, setSyncedName] = useState(prefillName);
  if (prefillName !== syncedName) {
    setSyncedName(prefillName);
    setDisplayName(prefillName === "there" ? "" : prefillName);
  }

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

  const onUseTelegramPhone = useCallback(async () => {
    haptics.selection();
    const p = await requestPhone();
    if (p) setPhone(p);
  }, [requestPhone]);

  const onSubmit = useCallback(async () => {
    setLocalError(null);
    const name = normalizeDisplayNameInput(displayName);
    if (!name) {
      setLocalError(t("errors.name"));
      return;
    }
    const phoneNorm = normalizePhoneInput(phone);
    if (phoneNorm === "invalid") {
      setLocalError(t("errors.phone"));
      return;
    }
    if (!savedCode) {
      setLocalError(t("errors.saveCode"));
      return;
    }
    try {
      haptics.impact("medium");
      await updateProfile({
        displayName: name,
        phone: phoneNorm,
        completeProfile: true,
      });
      haptics.notification("success");
      router.replace(ROUTES.home);
    } catch {
      /* error state from hook */
    }
  }, [displayName, phone, savedCode, updateProfile, router, t]);

  const err = localError ?? error;

  return (
    <div className="flex flex-col gap-5 pb-6" data-testid="profile-setup">
      <div className="space-y-1 pt-2">
        <h1 className="text-[1.375rem] font-semibold leading-snug text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <section className="space-y-2">
        <SectionLabel className="px-0.5">{t("displayName")}</SectionLabel>
        <Block className="p-3">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={FIELD}
            autoComplete="name"
            data-testid="profile-display-name"
            placeholder={t("displayNamePlaceholder")}
          />
        </Block>
      </section>

      <section className="space-y-2">
        <SectionLabel className="px-0.5">{t("phone")}</SectionLabel>
        <Block className="space-y-2 p-3">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={FIELD}
            autoComplete="tel"
            data-testid="profile-phone"
            placeholder={t("phonePlaceholder")}
          />
          {contactAvailable ? (
            <button
              type="button"
              onClick={() => void onUseTelegramPhone()}
              disabled={requesting}
              className="w-full py-2 text-sm font-medium text-primary active:opacity-80 disabled:opacity-50"
              data-testid="profile-tg-phone"
            >
              {requesting ? t("requestingPhone") : t("useTelegramPhone")}
            </button>
          ) : null}
          <p className="text-[0.75rem] text-muted-foreground">{t("phoneHint")}</p>
        </Block>
      </section>

      <section className="space-y-2">
        <SectionLabel className="px-0.5">{t("recoveryTitle")}</SectionLabel>
        <Block className="space-y-3 p-4">
          <p className="text-sm text-muted-foreground">{t("recoveryWarn")}</p>
          <div
            className="flex items-center gap-2 rounded-[10px] bg-surface-2 px-3 py-3"
            data-testid="profile-recovery-code"
          >
            <span className="flex-1 font-mono text-[1.0625rem] font-semibold tracking-wide text-foreground tnum">
              {codeLoading ? "····" : code ?? "—"}
            </span>
            <button
              type="button"
              onClick={() => void onCopy()}
              disabled={!code}
              className="flex size-10 items-center justify-center rounded-full text-primary active:scale-[0.97] disabled:opacity-40"
              aria-label={t("copyCode")}
              data-testid="profile-copy-code"
            >
              {copied ? (
                <Check size={20} strokeWidth={1.75} className="text-success" />
              ) : (
                <Copy size={20} strokeWidth={1.75} />
              )}
            </button>
          </div>
          <label className="flex min-h-[44px] cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={savedCode}
              onChange={(e) => setSavedCode(e.target.checked)}
              className="mt-1 size-5 accent-primary"
              data-testid="profile-saved-check"
            />
            <span className="text-sm leading-snug text-foreground">
              {t("savedConfirm")}
            </span>
          </label>
        </Block>
      </section>

      {err ? (
        <p className="text-sm text-danger" data-testid="profile-error">
          {err}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void onSubmit()}
        disabled={pending || codeLoading}
        className={cn(
          "inline-flex h-[52px] w-full items-center justify-center rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground",
          "active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-50",
        )}
        data-testid="profile-save"
      >
        {pending ? t("saving") : t("saveContinue")}
      </button>
    </div>
  );
}

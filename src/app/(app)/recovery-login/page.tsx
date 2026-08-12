"use client";
// File responsibility: recovery-code login when Telegram session is unavailable.
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Block } from "@/components/common/Block";
import { SectionLabel } from "@/components/common/SectionLabel";
import { useRecoveryLogin } from "@/hooks/useRecoveryLogin";
import { useSettingsStore } from "@/stores/settings.store";
import { haptics } from "@/lib/telegram/haptics";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const FIELD =
  "flex h-11 w-full items-center rounded-[10px] bg-surface-2 px-3 font-mono text-[0.9375rem] tracking-wide text-foreground outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground";

export default function RecoveryLoginPage() {
  const t = useTranslations("recovery");
  const router = useRouter();
  const { loginWithRecoveryCode, pending, error } = useRecoveryLogin();
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const onSubmit = useCallback(async () => {
    setLocalError(null);
    try {
      haptics.impact("medium");
      const user = await loginWithRecoveryCode(code);
      if (user.onboarded || user.profileCompleted) {
        setOnboarded(true);
      }
      haptics.notification("success");
      if (!user.profileCompleted) {
        router.replace(ROUTES.profileSetup);
      } else {
        router.replace(ROUTES.home);
      }
    } catch {
      /* hook error */
    }
  }, [code, loginWithRecoveryCode, router, setOnboarded]);

  const err = localError ?? error;

  return (
    <div className="flex flex-col gap-5 pb-6 pt-2" data-testid="recovery-login">
      <div className="space-y-1">
        <h1 className="text-[1.375rem] font-semibold leading-snug text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <section className="space-y-2">
        <SectionLabel className="px-0.5">{t("codeLabel")}</SectionLabel>
        <Block className="p-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={FIELD}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            placeholder="DH-XXXX-XXXX"
            data-testid="recovery-code-input"
          />
        </Block>
      </section>

      {err ? (
        <p className="text-sm text-danger" data-testid="recovery-error">
          {err}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void onSubmit()}
        disabled={pending || code.trim().length < 8}
        className={cn(
          "inline-flex h-[52px] w-full items-center justify-center rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground",
          "active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-50",
        )}
        data-testid="recovery-submit"
      >
        {pending ? t("signingIn") : t("signIn")}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href={ROUTES.home}
          className="font-medium text-primary"
          onClick={() => haptics.selection()}
        >
          {t("backHome")}
        </Link>
      </p>
    </div>
  );
}

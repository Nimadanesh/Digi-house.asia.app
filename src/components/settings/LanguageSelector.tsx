"use client";
// File responsibility: settings language row control — Auto + supported locales.
import { useLocale, useTranslations } from "next-intl";
import { LOCALES, LOCALE_META, type AppLocale } from "@/i18n/config";
import { useSettingsStore } from "@/stores/settings.store";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

export function LanguageSelector() {
  const t = useTranslations("settings");
  const active = useLocale() as AppLocale;
  const preferred = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);

  function pick(next: AppLocale | null) {
    haptics.selection();
    setLocale(next);
  }

  return (
    <div className="w-full space-y-2" data-testid="language-selector">
      <div className="flex flex-wrap gap-1.5">
        <Chip
          label={t("languageAuto")}
          active={preferred === null}
          onClick={() => pick(null)}
        />
        {LOCALES.map((code) => (
          <Chip
            key={code}
            label={LOCALE_META[code].nativeLabel}
            active={preferred === code || (preferred === null && active === code)}
            onClick={() => pick(code)}
            title={LOCALE_META[code].englishLabel}
          />
        ))}
      </div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
  title,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "min-h-[36px] shrink-0 rounded-full px-3 text-sm font-medium transition-colors duration-200 ease-out active:scale-[0.97]",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-surface-2 text-foreground",
      )}
    >
      {label}
    </button>
  );
}

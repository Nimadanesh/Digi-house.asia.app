"use client";
// File responsibility: Settings language row + Telegram-style picker sheet (12 locales + Auto).
import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Sheet } from "@/components/common/Sheet";
import { Block } from "@/components/common/Block";
import {
  LOCALES,
  LOCALE_META,
  localePickerLabel,
  type AppLocale,
} from "@/i18n/config";
import { useSettingsStore } from "@/stores/settings.store";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

export function LanguageSelector() {
  const t = useTranslations("settings");
  const preferred = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const [open, setOpen] = useState(false);

  const currentLabel =
    preferred === null
      ? t("languageAuto")
      : (LOCALE_META[preferred]?.nativeLabel ?? preferred);

  function pick(next: AppLocale | null) {
    haptics.selection();
    setLocale(next);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          haptics.selection();
          setOpen(true);
        }}
        className="flex w-full min-h-[56px] items-center gap-2 px-4 text-start active:bg-surface-2/60"
        data-testid="language-selector"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="text-sm text-foreground">{t("language")}</div>
          <div className="text-xs text-muted-foreground">{t("languageHint")}</div>
        </div>
        <span
          className="shrink-0 text-sm text-muted-foreground"
          data-testid="language-current"
        >
          {currentLabel}
        </span>
        <ChevronRight
          size={20}
          strokeWidth={1.75}
          className="shrink-0 text-muted-foreground rtl:rotate-180"
          aria-hidden
        />
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        labelledBy="language-picker-title"
        className="max-h-[85svh] overflow-y-auto"
      >
        <div className="space-y-3 pb-2" data-testid="language-picker-sheet">
          <h2
            id="language-picker-title"
            className="text-[1.0625rem] font-semibold text-foreground"
          >
            {t("chooseLanguage")}
          </h2>

          <Block>
            <LangRow
              label={t("languageAuto")}
              sub="Telegram · browser"
              selected={preferred === null}
              onClick={() => pick(null)}
              testId="lang-option-auto"
            />
            {LOCALES.map((code) => (
              <LangRow
                key={code}
                label={localePickerLabel(code)}
                selected={preferred === code}
                onClick={() => pick(code)}
                testId={`lang-option-${code}`}
              />
            ))}
          </Block>
        </div>
      </Sheet>
    </>
  );
}

function LangRow({
  label,
  sub,
  selected,
  onClick,
  testId,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "flex w-full min-h-[52px] items-center gap-3 border-t border-border px-4 text-start first:border-t-0 active:bg-surface-2/60",
        selected && "bg-primary/8",
      )}
    >
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-sm",
            selected ? "font-semibold text-primary" : "text-foreground",
          )}
        >
          {label}
        </div>
        {sub ? <div className="text-xs text-muted-foreground">{sub}</div> : null}
      </div>
      {selected ? (
        <Check size={18} strokeWidth={2.25} className="shrink-0 text-primary" aria-hidden />
      ) : (
        <span className="size-[18px] shrink-0" aria-hidden />
      )}
    </button>
  );
}

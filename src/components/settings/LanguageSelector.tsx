"use client";
// File responsibility: Settings language row + single-scroll picker sheet (picker order = LOCALES).
import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Sheet } from "@/components/common/Sheet";
import {
  LOCALES,
  LOCALE_META,
  localePickerLabel,
  type AppLocale,
} from "@/i18n/config";
import { SettingsLabelStack } from "@/components/settings/SettingsLabelStack";
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
        className="flex w-full min-h-[64px] items-center gap-2 px-4 py-3.5 text-start active:bg-surface-2/60 active:scale-[0.98] transition-transform duration-[120ms] ease-out"
        data-testid="language-selector"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <SettingsLabelStack title={t("language")} hint={t("languageHint")} />
        <span
          className="shrink-0 text-sm leading-snug text-muted-foreground"
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

      {/*
        Single scrollbar only: Sheet’s default inner scroller is disabled via bodyClassName
        overflow-hidden; this panel owns the only overflow-y-auto region (list).
      */}
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        labelledBy="language-picker-title"
        className="flex max-h-[min(85svh,680px)] flex-col overflow-hidden"
        bodyClassName="!max-h-none flex min-h-0 flex-1 flex-col overflow-hidden !px-0 !pt-0"
      >
        <div
          className="flex min-h-0 flex-1 flex-col"
          data-testid="language-picker-sheet"
        >
          <h2
            id="language-picker-title"
            className="shrink-0 px-4 pb-2 pt-3 text-[1.0625rem] font-semibold text-foreground"
          >
            {t("chooseLanguage")}
          </h2>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2 [-webkit-overflow-scrolling:touch]"
            data-testid="language-picker-list"
          >
            <div className="overflow-hidden rounded-[12px] bg-card">
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
            </div>
          </div>
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
        "flex w-full min-h-[52px] items-center gap-3 border-t border-border px-4 text-start first:border-t-0 active:bg-surface-2/60 active:scale-[0.98] transition-transform duration-[120ms] ease-out",
        selected && "bg-primary/8",
      )}
    >
      <div className="min-w-0 flex-1 space-y-1 py-1">
        <div
          className={cn(
            "text-sm leading-snug",
            selected ? "font-semibold text-primary" : "font-medium text-foreground",
          )}
        >
          {label}
        </div>
        {sub ? (
          <div className="text-xs leading-relaxed text-muted-foreground pb-0.5">{sub}</div>
        ) : null}
      </div>
      {selected ? (
        <Check size={18} strokeWidth={2.25} className="shrink-0 text-primary" aria-hidden />
      ) : (
        <span className="size-[18px] shrink-0" aria-hidden />
      )}
    </button>
  );
}

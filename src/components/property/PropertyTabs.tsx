// File responsibility: property tab strip (REDESIGN-SPEC §7). Horizontal-scroll on
// mobile, roving tabindex keyboard support, Telegram chip styling (flat, no shadow).
// Safe interaction per spec §21 — tab selection is immediate, haptic 'selection'.
//
// Phase 9 (UI Mapping §5.1): 5 → 4 tabs — Estate / Income / Ownership / Details.
// "Performance" and "Holders" dissolve: Performance content splits (funding charts →
// Estate, rental/income → Income, resale charts → demoted resale block); Holders
// content moves under Ownership. ids: overview→estate, holders→ownership.
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

export type PropertyTabId = "estate" | "income" | "ownership" | "details";

export const PROPERTY_TABS: PropertyTabId[] = [
  "estate",
  "income",
  "ownership",
  "details",
];

export function PropertyTabs({
  active,
  onChange,
}: {
  active: PropertyTabId;
  onChange: (tab: PropertyTabId) => void;
}) {
  const t = useTranslations("property");
  const listRef = useRef<HTMLDivElement>(null);

  function focusTab(tab: PropertyTabId) {
    const el = listRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${tab}"]`);
    el?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const idx = PROPERTY_TABS.indexOf(active);
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (idx + 1) % PROPERTY_TABS.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + PROPERTY_TABS.length) % PROPERTY_TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = PROPERTY_TABS.length - 1;
    if (next === null) return;
    e.preventDefault();
    const tab = PROPERTY_TABS[next];
    onChange(tab);
    focusTab(tab);
    haptics.selection();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={t("tabsLabel")}
      onKeyDown={handleKeyDown}
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1"
      data-testid="property-tabs"
    >
      {PROPERTY_TABS.map((tab) => {
        const selected = tab === active;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`tab-${tab}`}
            aria-selected={selected}
            aria-controls={`panel-${tab}`}
            tabIndex={selected ? 0 : -1}
            data-tab={tab}
            onClick={() => {
              if (tab === active) return;
              haptics.selection();
              onChange(tab);
            }}
            className={cn(
              "h-9 shrink-0 rounded-full px-4 text-[0.8125rem] font-medium transition-colors duration-200 ease-out active:scale-[0.97]",
              selected
                ? "bg-primary text-primary-foreground font-semibold"
                : "bg-surface-2 text-muted-foreground",
            )}
            data-testid={`tab-${tab}`}
          >
            {t(`tab${tab[0].toUpperCase()}${tab.slice(1)}` as const)}
          </button>
        );
      })}
    </div>
  );
}

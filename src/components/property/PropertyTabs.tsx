// File responsibility: property tab strip (REDESIGN-SPEC §7). Horizontal-scroll on
// mobile, roving tabindex keyboard support, premium filter-chip styling.
// Safe interaction per spec §21 — tab selection is immediate, haptic 'selection'.
//
// Phase 9 (UI Mapping §5.1): 5 → 4 tabs — Estate / Income / Ownership / Details.
// "Performance" and "Holders" dissolve: Performance content splits (funding charts →
// Estate, rental/income → Income, resale charts → demoted resale block); Holders
// content moves under Ownership. ids: overview→estate, holders→ownership.
// Revision contract 2026-09-13: Earn joins as the 4th tab (Overview → Income →
// Ownership → Earn → Details).
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { BorderBeam } from "border-beam";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

export type PropertyTabId = "estate" | "income" | "ownership" | "earn" | "details";

export const PROPERTY_TABS: PropertyTabId[] = [
  "estate",
  "income",
  "ownership",
  "earn",
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
    // Slice 7: arrow direction follows document direction (WAI-APG) — in RTL,
    // ArrowLeft advances visually-left (next), ArrowRight goes back.
    const rtl =
      typeof document !== "undefined" && document.documentElement.dir === "rtl";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const backward = rtl ? "ArrowRight" : "ArrowLeft";
    let next: number | null = null;
    if (e.key === forward) next = (idx + 1) % PROPERTY_TABS.length;
    else if (e.key === backward) next = (idx - 1 + PROPERTY_TABS.length) % PROPERTY_TABS.length;
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
      className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 py-1.5"
      data-testid="property-tabs"
    >
      {PROPERTY_TABS.map((tab) => {
        const selected = tab === active;
        const button = (
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
              "h-9 shrink-0 rounded-full px-3.5 text-[0.8125rem] font-medium leading-none tracking-[-0.01em] transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              selected
                ? "bg-card font-semibold text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.08)] ring-1 ring-border/60"
                : "bg-transparent text-muted-foreground ring-1 ring-transparent hover:bg-card/70 hover:text-foreground",
            )}
            data-testid={`tab-${tab}`}
          >
            {t(`tab${tab[0].toUpperCase()}${tab.slice(1)}` as const)}
          </button>
        );
        // Earn tab carries the libraries.dev beam. The wrapper div is only
        // the flex item (shrink-0); the pill button stays the beam's first
        // child so its radius is auto-detected and the label stays crisp.
        if (tab !== "earn") return button;
        return (
          <BorderBeam
            key={tab}
            size="md"
            colorVariant="colorful"
            strength={0.7}
            className="shrink-0"
          >
            {button}
          </BorderBeam>
        );
      })}
    </div>
  );
}

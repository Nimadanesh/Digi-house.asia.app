"use client";
// File responsibility: stay preference sheet — concise grouped chip selectors
// for timing, travelers, occasion, composition, experience and destination.
// Saves a preference draft (partial allowed; completeness is derived, never
// forced). Uses the shared Sheet; no booking, no guarantees.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import { Sheet } from "@/components/common/Sheet";
import { cn } from "@/lib/utils";
import type {
  StayComposition,
  StayExperience,
  StayOccasion,
  StayPreference,
  StayRegion,
  StaySeasonPref,
} from "@/lib/club/stay-journey";
import styles from "./club-glass.module.css";

const SEASONS: StaySeasonPref[] = ["spring", "summer", "autumn", "winter", "flexible"];
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const TRAVELERS = [1, 2, 3, 4, 5];
const OCCASIONS: StayOccasion[] = [
  "anniversary",
  "proposal",
  "valentine",
  "birthday",
  "honeymoon",
  "family",
  "getaway",
  "other",
];
const COMPOSITIONS: StayComposition[] = ["couple", "family", "friends", "solo"];
const EXPERIENCES: StayExperience[] = [
  "beach",
  "nature",
  "privacy",
  "adventure",
  "romance",
  "wellness",
  "culture",
  "family",
];
const REGIONS: StayRegion[] = [
  "caribbean",
  "mediterranean",
  "indian_ocean",
  "europe",
  "americas",
  "no_preference",
];

function Chip({
  selected,
  onSelect,
  testId,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={selected}
      onClick={() => {
        haptics.selection();
        onSelect();
      }}
      className={cn(
        "flex min-h-[44px] items-center rounded-full border px-4 text-sm font-medium active:opacity-80",
        selected
          ? "border-[#4B8BFF]/50 bg-[#4B8BFF]/15 text-[#4B8BFF]"
          : "border-white/[0.1] bg-white/[0.05] text-[#A0A8B8]",
      )}
    >
      {children}
    </button>
  );
}

function monthName(month: number): string {
  return new Date(Date.UTC(2027, month - 1, 1)).toLocaleString("en", { month: "long", timeZone: "UTC" });
}

const EMPTY_DRAFT: StayPreference = {
  season: null,
  month: null,
  travelers: null,
  occasion: null,
  composition: null,
  experience: null,
  region: null,
};

export function ClubStayPreferenceSheet({
  open,
  initial,
  onSave,
  onClose,
}: {
  open: boolean;
  initial: StayPreference | null;
  onSave: (preference: StayPreference) => void;
  onClose: () => void;
}) {
  const t = useTranslations("club");
  const [draft, setDraft] = useState<StayPreference>(initial ?? EMPTY_DRAFT);
  const set = <K extends keyof StayPreference>(key: K, value: Exclude<StayPreference[K], null>) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <Sheet open={open} onClose={onClose} labelledBy="club-stay-sheet-title" className={`bg-transparent ${styles.sheetPanel}`}>
      <div className="space-y-5 pb-2" data-testid="club-stay-sheet">
        <h2 id="club-stay-sheet-title" className="text-[1.0625rem] font-semibold tracking-tight text-foreground">
          {t("stayTellUs")}
        </h2>

        <div>
          <h3 className="text-[0.8125rem] font-semibold text-foreground">{t("stayTiming")}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {SEASONS.map((key) => (
              <Chip key={key} selected={draft.season === key} onSelect={() => set("season", key)}>
                {t(`staySeasonName.${key}`)}
              </Chip>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {MONTHS.map((month) => (
              <Chip
                key={month}
                selected={draft.month === month}
                onSelect={() => setDraft((d) => ({ ...d, month: d.month === month ? null : month }))}
              >
                {monthName(month)}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[0.8125rem] font-semibold text-foreground">{t("stayTravelers")}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {TRAVELERS.map((n) => (
              <Chip key={n} selected={draft.travelers === n} onSelect={() => set("travelers", n)}>
                {n >= 5 ? t("stayTravelersPlus") : String(n)}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[0.8125rem] font-semibold text-foreground">{t("stayOccasion")}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {OCCASIONS.map((key) => (
              <Chip key={key} selected={draft.occasion === key} onSelect={() => set("occasion", key)}>
                {t(`stayOccasionName.${key}`)}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[0.8125rem] font-semibold text-foreground">{t("stayComposition")}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {COMPOSITIONS.map((key) => (
              <Chip key={key} selected={draft.composition === key} onSelect={() => set("composition", key)}>
                {t(`stayCompositionName.${key}`)}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[0.8125rem] font-semibold text-foreground">{t("stayExperience")}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXPERIENCES.map((key) => (
              <Chip key={key} selected={draft.experience === key} onSelect={() => set("experience", key)}>
                {t(`stayExperienceName.${key}`)}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[0.8125rem] font-semibold text-foreground">{t("stayDestination")}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {REGIONS.map((key) => (
              <Chip key={key} selected={draft.region === key} onSelect={() => set("region", key)}>
                {key === "no_preference" ? t("stayNoPreference") : t(`stayRegionName.${key}`)}
              </Chip>
            ))}
          </div>
        </div>

        <button
          type="button"
          data-testid="club-stay-save"
          onClick={() => {
            haptics.impact("light");
            onSave(draft);
          }}
          className={`${styles.btnPrimary} flex min-h-[52px] w-full items-center justify-center text-[15px] font-semibold transition-transform duration-150 ease-out active:scale-[0.98]`}
        >
          {t("staySavePreferences")}
        </button>
      </div>
    </Sheet>
  );
}

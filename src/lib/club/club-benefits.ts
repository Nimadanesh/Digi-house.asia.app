// File responsibility: Private Club benefit catalogue — UI prototype only.
// Six static benefit definitions with the tier each unlocks at. No booking,
// referral, credit, or concierge systems; tiles open an informational Sheet.
import { getClubTierState, type ClubTierId } from "./club-tiers";

export type ClubBenefitId = "villa" | "escape" | "priority" | "concierge" | "card" | "referral";

export type ClubBenefitGroup = "access" | "experiences" | "membership";

export interface ClubBenefit {
  id: ClubBenefitId;
  /** Lucide icon name key resolved in ClubBenefits (no dynamic imports). */
  icon: "villa" | "escape" | "priority" | "concierge" | "card" | "referral";
  /** First tier at which this benefit shows as unlocked. */
  unlockedAtTierId: ClubTierId;
  /** Display group on the Club page (Access / Experiences / Membership). */
  group: ClubBenefitGroup;
  /** i18n key suffixes under the `club` namespace (e.g. `club.benefit.villa.title`). */
  titleKey: string;
  bodyKey: string;
  /** i18n key suffix for the one-line "how it works" (e.g. `club.benefit.villa.how`). */
  howKey: string;
}

/** Exactly the six approved benefits, in display order. */
export const CLUB_BENEFITS: readonly ClubBenefit[] = [
  { id: "villa", icon: "villa", unlockedAtTierId: "private", group: "access", titleKey: "benefit.villa.title", bodyKey: "benefit.villa.body", howKey: "benefit.villa.how" },
  { id: "escape", icon: "escape", unlockedAtTierId: "private", group: "experiences", titleKey: "benefit.escape.title", bodyKey: "benefit.escape.body", howKey: "benefit.escape.how" },
  { id: "priority", icon: "priority", unlockedAtTierId: "private", group: "access", titleKey: "benefit.priority.title", bodyKey: "benefit.priority.body", howKey: "benefit.priority.how" },
  { id: "concierge", icon: "concierge", unlockedAtTierId: "private_plus", group: "experiences", titleKey: "benefit.concierge.title", bodyKey: "benefit.concierge.body", howKey: "benefit.concierge.how" },
  { id: "card", icon: "card", unlockedAtTierId: "private", group: "membership", titleKey: "benefit.card.title", bodyKey: "benefit.card.body", howKey: "benefit.card.how" },
  { id: "referral", icon: "referral", unlockedAtTierId: "private", group: "membership", titleKey: "benefit.referral.title", bodyKey: "benefit.referral.body", howKey: "benefit.referral.how" },
] as const;

/** True when `benefit` shows as unlocked for a member at `tierId`. */
export function isBenefitUnlocked(benefit: ClubBenefit, tierId: ClubTierId): boolean {
  return getClubTierState(benefit.unlockedAtTierId, tierId) !== "future";
}

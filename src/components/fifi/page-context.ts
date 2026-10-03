// File responsibility: Fifi UI prototype — page awareness (FIFI-05 UX Foundation).
// Maps the current route to a screen context the mock conversation engine can use.
// Internal labels only; nothing here is ever rendered verbatim to the user.
import { ROUTES } from "@/lib/constants";

export type FifiScreen =
  | "home"
  | "marketplace"
  | "estate"
  | "portfolio"
  | "earnings"
  | "club"
  | "card"
  | "referral"
  | "transactions"
  | "settings"
  | "other";

export interface FifiPageContext {
  screen: FifiScreen;
  /** Canonical property id when the user is viewing an estate (`/property/re-*`). */
  propertyId?: string;
}

const EXACT: Readonly<Record<string, FifiScreen>> = {
  "/": "home",
  [ROUTES.home]: "home",
  [ROUTES.marketplace]: "marketplace",
  [ROUTES.portfolio]: "portfolio",
  [ROUTES.earnings]: "earnings",
  [ROUTES.club]: "club",
  [ROUTES.card]: "card",
  [ROUTES.referral]: "referral",
  [ROUTES.transactions]: "transactions",
  [ROUTES.settings]: "settings",
};

export function fifiPageContext(pathname: string): FifiPageContext {
  if (pathname.startsWith(`${ROUTES.property("")}`)) {
    const propertyId = pathname.slice(ROUTES.property("").length).replace(/\/+$/, "");
    if (propertyId) return { screen: "estate", propertyId };
  }
  return { screen: EXACT[pathname] ?? "other" };
}

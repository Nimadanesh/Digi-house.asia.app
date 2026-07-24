// File responsibility: literals only — routes, tab list, disclaimer text, defaults.
import { Home, Store, Wallet, PieChart } from "lucide-react";

export const ROUTES = {
  home: "/home",
  marketplace: "/marketplace",
  property: (id: string) => `/property/${id}`,
  earnings: "/earnings",
  portfolio: "/portfolio",
  settings: "/settings",
} as const;

export interface TabDef { href: string; label: string; icon: typeof Home }

export const TABS: readonly TabDef[] = [
  { href: ROUTES.home,        label: "Home",        icon: Home },
  { href: ROUTES.marketplace, label: "Marketplace", icon: Store },
  { href: ROUTES.earnings,   label: "Earnings",    icon: Wallet },
  { href: ROUTES.portfolio,  label: "Portfolio",   icon: PieChart },
] as const;

export const PAYOUT_DISCLAIMER = "simulated weekly payout · on-chain verifiable post-MVP";

export const DEFAULTS = { payoutTickMs: 60_000 } as const;
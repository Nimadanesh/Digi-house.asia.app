// File responsibility: literals only — routes, tab list, disclaimer text, defaults.
import { Home, Store, Wallet, PieChart } from "lucide-react";

export const ROUTES = {
  home: "/home",
  marketplace: "/marketplace",
  property: (id: string) => `/property/${id}`,
  earnings: "/earnings",
  portfolio: "/portfolio",
  settings: "/settings",
  transactions: "/transactions",
  onboarding: "/onboarding",
  profileSetup: "/profile-setup",
  recoveryLogin: "/recovery-login",
} as const;

export interface TabDef { href: string; label: string; icon: typeof Home }

export const TABS: readonly TabDef[] = [
  { href: ROUTES.home,        label: "Home",        icon: Home },
  { href: ROUTES.marketplace, label: "Marketplace", icon: Store },
  { href: ROUTES.earnings,   label: "Earnings",    icon: Wallet },
  { href: ROUTES.portfolio,  label: "Portfolio",   icon: PieChart },
] as const;

export const PAYOUT_DISCLAIMER = "simulated monthly payout · on-chain verifiable post-MVP";

/** Shown once on Property detail About and Buy success (MVP honesty). */
export const DEMO_TX_DISCLAIMER = "This is a demo – transactions are simulated";

export const DEFAULTS = { payoutTickMs: 60_000 } as const;

export const TON_PRICE_USD_CENTS = 200; // $2.00 per TON (MVP display-only estimate; real quote is post-MVP)
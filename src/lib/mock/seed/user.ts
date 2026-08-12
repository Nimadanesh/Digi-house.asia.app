// File responsibility: demo investor profile.
import type { UserProfile } from "@/types/user";

export const USER: UserProfile = {
  id: "user-aria-demo",
  displayName: "Demo Investor",
  username: "demoinvestor",
  role: "investor",
  walletAddress: "EQHq2VsN7yKwTp8rUy4mL0kHbZ6sAeF4oVgB8uTr9pXkMdH5",
  phone: undefined,
  onboarded: false,
  profileCompleted: false,
  useTelegramTheme: false,
  createdAt: "2026-03-10T12:00:00Z",
};

/** Mock recovery code for Settings display outside API mode. */
export const MOCK_RECOVERY_CODE = "DH-DEMO-SEED";

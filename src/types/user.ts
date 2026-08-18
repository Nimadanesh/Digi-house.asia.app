export type UserRole = "investor" | "owner";

export interface UserProfile {
  id: string;
  displayName: string;
  username?: string;
  photoUrl?: string;
  role: UserRole;
  walletAddress: string | null;
  /** USDT withdrawal destination (PE-01); verified only after admin check. */
  withdrawalAddress: string | null;
  withdrawalAddressVerified: boolean;
  phone?: string;
  onboarded: boolean;
  /** Light profile (name/phone + recovery ack) finished. */
  profileCompleted: boolean;
  useTelegramTheme: boolean;
  referredByUserId?: string;
  createdAt: string;
}

export type UserRole = "investor" | "owner";

export interface UserProfile {
  id: string;
  displayName: string;
  username?: string;
  photoUrl?: string;
  role: UserRole;
  walletAddress: string | null;
  onboarded: boolean;
  useTelegramTheme: boolean;
  referredByUserId?: string;
  createdAt: string;
}
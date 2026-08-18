import type { UserRow } from "../db/schema/users.js";

/** OpenAPI / Mini App user JSON (camelCase). Recovery code is NEVER included here. */
export type UserPublic = {
  id: string;
  displayName: string;
  username?: string;
  photoUrl?: string;
  role: "investor" | "owner";
  walletAddress: string | null;
  /** USDT withdrawal destination; verified only after admin check (PE-01). */
  withdrawalAddress: string | null;
  withdrawalAddressVerified: boolean;
  phone?: string;
  onboarded: boolean;
  profileCompleted: boolean;
  useTelegramTheme: boolean;
  referredByUserId?: string;
  createdAt: string;
};

export function toUserPublic(row: UserRow): UserPublic {
  const role = row.role === "owner" ? "owner" : "investor";
  return {
    id: row.id,
    displayName: row.displayName,
    ...(row.username ? { username: row.username } : {}),
    ...(row.photoUrl ? { photoUrl: row.photoUrl } : {}),
    role,
    walletAddress: row.walletAddress ?? null,
    withdrawalAddress: row.withdrawalAddress ?? null,
    withdrawalAddressVerified: row.withdrawalAddressVerified,
    ...(row.phone ? { phone: row.phone } : {}),
    onboarded: row.onboarded,
    profileCompleted: row.profileCompletedAt != null,
    useTelegramTheme: row.useTelegramTheme,
    ...(row.referredByUserId ? { referredByUserId: row.referredByUserId } : {}),
    createdAt: row.createdAt.toISOString(),
  };
}

export type TelegramProfileInput = {
  userId: string;
  displayName: string;
  username?: string;
  photoUrl?: string;
  referredByUserId?: string;
};

export type UpdateProfileInput = {
  displayName?: string;
  phone?: string | null;
  /** When true, sets profile_completed_at if not already set. */
  completeProfile?: boolean;
};

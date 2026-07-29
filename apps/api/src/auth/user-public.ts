import type { UserRow } from "../db/schema/users.js";

/** OpenAPI / Mini App user JSON (camelCase). */
export type UserPublic = {
  id: string;
  displayName: string;
  username?: string;
  photoUrl?: string;
  role: "investor" | "owner";
  walletAddress: string | null;
  onboarded: boolean;
  useTelegramTheme: boolean;
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
    onboarded: row.onboarded,
    useTelegramTheme: row.useTelegramTheme,
    createdAt: row.createdAt.toISOString(),
  };
}

export type TelegramProfileInput = {
  userId: string;
  displayName: string;
  username?: string;
  photoUrl?: string;
};

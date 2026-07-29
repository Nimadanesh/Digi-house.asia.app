import { createHmac, timingSafeEqual } from "node:crypto";

export const DEFAULT_INIT_DATA_MAX_AGE_SECONDS = 86_400; // 24h

export type InitDataOk = {
  ok: true;
  userId: string;
  authDate: Date;
  username?: string;
  displayName?: string;
  photoUrl?: string;
  /** All query pairs except hash (decoded values). */
  raw: Record<string, string>;
};

export type InitDataErrCode =
  | "malformed"
  | "invalid_hash"
  | "expired"
  | "missing_user";

export type InitDataErr = {
  ok: false;
  code: InitDataErrCode;
  message: string;
};

export type ValidateInitDataOptions = {
  /** Max age of auth_date; default 86400 (24h). */
  maxAgeSeconds?: number;
  /** Injectable clock for tests. */
  now?: Date;
};

type TelegramWebAppUser = {
  id: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
};

/**
 * Validate Telegram Mini App `initData` (data-check string + HMAC).
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Fail closed: any parse/hash/expiry/user issue → ok: false.
 * No network. Bot token must be server-only (never NEXT_PUBLIC_*).
 */
export function validateInitData(
  initData: string,
  botToken: string,
  opts: ValidateInitDataOptions = {},
): InitDataOk | InitDataErr {
  if (typeof initData !== "string" || initData.trim() === "") {
    return err("malformed", "initData is empty");
  }
  if (typeof botToken !== "string" || botToken.trim() === "") {
    return err("malformed", "bot token is empty");
  }

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return err("malformed", "initData is not a valid query string");
  }

  const hash = params.get("hash");
  if (!hash || !/^[0-9a-fA-F]+$/.test(hash) || hash.length % 2 !== 0) {
    return err("malformed", "hash missing or not hex");
  }

  const pairs: Array<[string, string]> = [];
  for (const [key, value] of params.entries()) {
    if (key === "hash") continue;
    pairs.push([key, value]);
  }
  if (pairs.length === 0) {
    return err("malformed", "no data fields to check");
  }

  pairs.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const dataCheckString = pairs.map(([k, v]) => `${k}=${v}`).join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculated = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (!safeEqualHex(calculated, hash)) {
    return err("invalid_hash", "initData HMAC mismatch");
  }

  const authDateRaw = params.get("auth_date");
  if (!authDateRaw || !/^\d+$/.test(authDateRaw)) {
    return err("malformed", "auth_date missing or invalid");
  }
  const authUnix = Number(authDateRaw);
  const authDate = new Date(authUnix * 1000);
  if (Number.isNaN(authDate.getTime())) {
    return err("malformed", "auth_date out of range");
  }

  const maxAge = opts.maxAgeSeconds ?? DEFAULT_INIT_DATA_MAX_AGE_SECONDS;
  const now = opts.now ?? new Date();
  const ageSeconds = Math.floor(now.getTime() / 1000) - authUnix;
  if (ageSeconds > maxAge) {
    return err("expired", `auth_date older than ${maxAge}s`);
  }
  // Reject far-future auth_date (clock skew / tamper after hash would already fail)
  if (ageSeconds < -60) {
    return err("malformed", "auth_date is in the future");
  }

  const userRaw = params.get("user");
  if (!userRaw) {
    return err("missing_user", "user field missing");
  }

  let user: TelegramWebAppUser;
  try {
    user = JSON.parse(userRaw) as TelegramWebAppUser;
  } catch {
    return err("malformed", "user JSON invalid");
  }

  if (user.id === undefined || user.id === null || user.id === "") {
    return err("missing_user", "user.id missing");
  }
  const userId = String(user.id);
  if (!/^\d+$/.test(userId)) {
    return err("malformed", "user.id must be numeric string");
  }

  const displayName = [user.first_name, user.last_name]
    .filter((p): p is string => Boolean(p && p.trim()))
    .join(" ")
    .trim();

  const raw: Record<string, string> = {};
  for (const [k, v] of pairs) raw[k] = v;

  return {
    ok: true,
    userId,
    authDate,
    ...(user.username ? { username: user.username } : {}),
    ...(displayName ? { displayName } : {}),
    ...(user.photo_url ? { photoUrl: user.photo_url } : {}),
    raw,
  };
}

function err(code: InitDataErrCode, message: string): InitDataErr {
  return { ok: false, code, message };
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length || ba.length === 0) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

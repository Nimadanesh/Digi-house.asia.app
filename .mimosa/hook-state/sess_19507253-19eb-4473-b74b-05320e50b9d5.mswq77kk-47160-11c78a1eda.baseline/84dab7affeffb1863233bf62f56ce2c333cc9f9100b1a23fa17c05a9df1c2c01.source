import { createHmac } from "node:crypto";

/** Fixture bot token for unit tests only — not a real BotFather token. */
export const FIXTURE_BOT_TOKEN = "test-bot-token-p1-04-not-real";

export type BuildInitDataFields = {
  user: {
    id: number | string;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  };
  authDate?: number;
  /** Extra query fields included in the signed payload. */
  extra?: Record<string, string>;
};

/**
 * Build a signed `initData` query string with the Telegram WebApp algorithm.
 * For tests only — not an HTTP helper.
 */
export function buildInitDataForTests(
  botToken: string,
  fields: BuildInitDataFields,
): string {
  const authDate =
    fields.authDate ?? Math.floor(Date.now() / 1000);
  const pairs: Record<string, string> = {
    auth_date: String(authDate),
    user: JSON.stringify(fields.user),
    ...fields.extra,
  };

  const dataCheckString = Object.keys(pairs)
    .sort()
    .map((k) => `${k}=${pairs[k]}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const params = new URLSearchParams({ ...pairs, hash });
  return params.toString();
}

/**
 * Mint a JWT for E2E tests using API signing.
 * Prints the token to stdout. Run once per seeded user.
 *
 * Usage:
 *   npx tsx e2e/helpers/mint-jwt.ts
 *
 * Reads:
 *   - API .env for SESSION_SECRET
 *   - E2E_USER_ID for a seeded user ID
 */
import { createHmac } from "node:crypto";

// This must match apps/api/src/auth/session.ts signSessionToken
function signSessionToken(
  payload: { sub: string; role?: string },
  secret: string,
  ttlSeconds: number
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + ttlSeconds };
  const encode = (o: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  const data = `${encode(header)}.${encode(body)}`;
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

const secret = process.env.SESSION_SECRET ?? "dev-only-session-secret-min-32-chars!!";
const userId = process.env.E2E_USER_ID ?? "4242";
const ttl = Number(process.env.E2E_TOKEN_TTL ?? "86400");

const token = signSessionToken({ sub: userId, role: "investor" }, secret, ttl);
console.log(token);

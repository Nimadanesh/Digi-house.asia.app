import { SignJWT, jwtVerify } from "jose";

export type SessionClaims = {
  sub: string;
  exp: number;
  iat: number;
};

export type SessionConfig = {
  secret: string;
  ttlSeconds: number;
};

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  userId: string,
  cfg: SessionConfig,
  now: Date = new Date(),
): Promise<{ token: string; expiresAt: Date }> {
  const iat = Math.floor(now.getTime() / 1000);
  const exp = iat + cfg.ttlSeconds;
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(secretKey(cfg.secret));
  return { token, expiresAt: new Date(exp * 1000) };
}

export async function verifySessionToken(
  token: string,
  cfg: SessionConfig,
): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(cfg.secret), {
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string" || !payload.sub) return null;
    if (typeof payload.exp !== "number" || typeof payload.iat !== "number") {
      return null;
    }
    return { sub: payload.sub, exp: payload.exp, iat: payload.iat };
  } catch {
    return null;
  }
}

export function bearerTokenFromHeader(
  authorization: string | undefined,
): string | null {
  if (!authorization) return null;
  const m = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
  return m?.[1] ?? null;
}

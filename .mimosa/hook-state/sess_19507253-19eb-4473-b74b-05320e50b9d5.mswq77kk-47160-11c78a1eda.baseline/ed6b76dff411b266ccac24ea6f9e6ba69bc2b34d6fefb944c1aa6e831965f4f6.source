import { Hono } from "hono";
import { validateInitData } from "../auth/validate-init-data.js";
import {
  signSessionToken,
  type SessionConfig,
} from "../auth/session.js";
import { requireSession } from "../auth/require-session.js";
import type { UserStore } from "../auth/user-store.js";
import {
  normalizeDisplayName,
  normalizePhone,
} from "../auth/profile-validate.js";
import {
  isValidRecoveryCodeFormat,
  normalizeRecoveryCode,
} from "../auth/recovery-code.js";
import {
  slidingWindowRateLimit,
  ipKey,
} from "../lib/rate-limit.js";

export type AuthRouteDeps = {
  botToken: string;
  session: SessionConfig;
  users: UserStore;
  rateLimitMax?: number;
  /** Stricter limit for recovery login (default 5 / min / IP). */
  recoveryRateLimitMax?: number;
};

export function createAuthRoutes(deps: AuthRouteDeps) {
  const app = new Hono();
  const authMax = deps.rateLimitMax ?? 10;
  const recoveryMax = deps.recoveryRateLimitMax ?? 5;

  app.post(
    "/v1/auth/telegram",
    slidingWindowRateLimit({
      windowMs: 60_000,
      max: authMax,
      key: ipKey,
    }),
    async (c) => {
      let body: unknown;
      try {
        body = await c.req.json();
      } catch {
        return c.json(
          { code: "validation_error", message: "Invalid JSON body" },
          400,
        );
      }

      const initData =
        body &&
        typeof body === "object" &&
        "initData" in body &&
        typeof (body as { initData: unknown }).initData === "string"
          ? (body as { initData: string }).initData
          : null;

      if (!initData || initData.trim() === "") {
        return c.json(
          { code: "validation_error", message: "initData is required" },
          400,
        );
      }

      if (!deps.botToken) {
        return c.json(
          {
            code: "misconfigured",
            message: "TELEGRAM_BOT_TOKEN is not configured",
          },
          503,
        );
      }

      const parsed = validateInitData(initData, deps.botToken);
      if (!parsed.ok) {
        const status = parsed.code === "malformed" ? 400 : 401;
        return c.json(
          {
            code: parsed.code,
            message: parsed.message,
          },
          status,
        );
      }

      const displayName =
        parsed.displayName?.trim() || parsed.username || "User";

      let referredByUserId: string | undefined;
      const startParam = parsed.raw["start_param"];
      if (typeof startParam === "string" && startParam.startsWith("ref_")) {
        const candidate = startParam.slice(4);
        if (candidate && candidate !== parsed.userId) {
          const referrer = await deps.users.findById(candidate);
          if (referrer) {
            referredByUserId = candidate;
          }
        }
      }

      const user = await deps.users.upsertFromTelegram({
        userId: parsed.userId,
        displayName,
        username: parsed.username,
        photoUrl: parsed.photoUrl,
        referredByUserId,
      });
      const { token, expiresAt } = await signSessionToken(
        user.id,
        deps.session,
      );
      return c.json({
        token,
        user,
        expiresAt: expiresAt.toISOString(),
      });
    },
  );

  app.post(
    "/v1/auth/recovery",
    slidingWindowRateLimit({
      windowMs: 60_000,
      max: recoveryMax,
      key: (c) => `recovery:${ipKey(c)}`,
    }),
    async (c) => {
      let body: unknown;
      try {
        body = await c.req.json();
      } catch {
        return c.json(
          { code: "validation_error", message: "Invalid JSON body" },
          400,
        );
      }

      const codeRaw =
        body &&
        typeof body === "object" &&
        "code" in body &&
        typeof (body as { code: unknown }).code === "string"
          ? (body as { code: string }).code
          : null;

      if (!codeRaw || !isValidRecoveryCodeFormat(codeRaw)) {
        return c.json(
          {
            code: "validation_error",
            message: "Valid recovery code is required (DH-XXXX-XXXX)",
          },
          400,
        );
      }

      const user = await deps.users.findByRecoveryCode(
        normalizeRecoveryCode(codeRaw),
      );
      if (!user) {
        // Generic message — do not reveal whether format-valid codes exist
        return c.json(
          { code: "unauthorized", message: "Invalid recovery code" },
          401,
        );
      }

      const { token, expiresAt } = await signSessionToken(
        user.id,
        deps.session,
      );
      return c.json({
        token,
        user,
        expiresAt: expiresAt.toISOString(),
      });
    },
  );

  app.get(
    "/v1/me",
    requireSession({ session: deps.session, users: deps.users }),
    async (c) => {
      const sessionUser = c.get("user");
      // Backfill recovery code on session touch
      const ensured = await deps.users.ensureRecoveryCode(sessionUser.id);
      return c.json({ user: ensured ?? sessionUser });
    },
  );

  app.get(
    "/v1/me/recovery-code",
    requireSession({ session: deps.session, users: deps.users }),
    slidingWindowRateLimit({
      windowMs: 60_000,
      max: 20,
      key: (c) => `rec-code:${c.get("userId")}`,
    }),
    async (c) => {
      const userId = c.get("userId");
      const code = await deps.users.getRecoveryCode(userId);
      if (!code) {
        return c.json(
          { code: "not_found", message: "User not found" },
          404,
        );
      }
      return c.json({ recoveryCode: code });
    },
  );

  app.patch(
    "/v1/me",
    requireSession({ session: deps.session, users: deps.users }),
    async (c) => {
      let body: unknown;
      try {
        body = await c.req.json();
      } catch {
        return c.json(
          { code: "validation_error", message: "Invalid JSON body" },
          400,
        );
      }
      if (!body || typeof body !== "object") {
        return c.json(
          { code: "validation_error", message: "Invalid JSON body" },
          400,
        );
      }
      const b = body as Record<string, unknown>;

      let displayName: string | undefined;
      if ("displayName" in b) {
        const n = normalizeDisplayName(b.displayName);
        if (!n) {
          return c.json(
            {
              code: "validation_error",
              message: "displayName must be 2–64 characters",
            },
            400,
          );
        }
        displayName = n;
      }

      let phone: string | null | undefined;
      if ("phone" in b) {
        const p = normalizePhone(b.phone);
        if (!p.ok) {
          return c.json(
            { code: "validation_error", message: "Invalid phone number" },
            400,
          );
        }
        phone = p.phone;
      }

      const completeProfile = b.completeProfile === true;

      if (
        displayName === undefined &&
        phone === undefined &&
        !completeProfile
      ) {
        return c.json(
          {
            code: "validation_error",
            message: "No profile fields to update",
          },
          400,
        );
      }

      const sessionUser = c.get("user");
      const updated = await deps.users.updateProfile(sessionUser.id, {
        displayName,
        phone,
        completeProfile,
      });
      if (!updated) {
        return c.json(
          { code: "not_found", message: "User not found" },
          404,
        );
      }
      return c.json({ user: updated });
    },
  );

  app.post(
    "/v1/me/onboarded",
    requireSession({ session: deps.session, users: deps.users }),
    async (c) => {
      const sessionUser = c.get("user");
      const updated = await deps.users.markOnboarded(sessionUser.id);
      if (!updated) {
        return c.json(
          { code: "not_found", message: "User not found" },
          404,
        );
      }
      return c.json({ user: updated });
    },
  );

  return app;
}

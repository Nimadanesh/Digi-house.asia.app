import type { MiddlewareHandler } from "hono";

/**
 * Admin authentication via X-Admin-Key header matching ADMIN_API_SECRET.
 * Returns 401 if missing or wrong.
 */
export function requireAdminSecret(adminSecret: string): MiddlewareHandler {
  return async (c, next) => {
    const key = c.req.header("x-admin-key");
    if (!key || key !== adminSecret) {
      return c.json(
        { code: "unauthorized", message: "Invalid or missing admin key" },
        401,
      );
    }
    await next();
  };
}

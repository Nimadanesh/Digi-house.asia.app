import type { MiddlewareHandler } from "hono";
import {
  isAllowed,
  LAUNCH_NOT_ALLOWLISTED,
  type LaunchMode,
} from "../launch/allowlist.js";

export function requireAllowlist(
  allowlist: Set<string>,
  launchMode: LaunchMode,
  getKey: (c: Parameters<MiddlewareHandler>[0]) => string,
): MiddlewareHandler {
  return async (c, next) => {
    if (launchMode === "open") {
      await next();
      return;
    }
    const key = getKey(c);
    if (!isAllowed(key, allowlist, launchMode)) {
      return c.json(
        {
          code: LAUNCH_NOT_ALLOWLISTED,
          message: "Your wallet is not on the launch allowlist",
        },
        403,
      );
    }
    await next();
  };
}

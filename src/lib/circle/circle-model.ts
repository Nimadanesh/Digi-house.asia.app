// File responsibility: Luxe Circle prototype source — the honest empty Circle
// returned until a real backend exists. No fabricated members, counts, or
// properties. Pure; no React, no network.
import type { LuxeCircleSummary } from "@/types/circle";

/** The prototype Circle: zero members, zero shared properties, honestly empty. */
export function getPrototypeCircle(): LuxeCircleSummary {
  return {
    memberCount: 0,
    sharedPropertyCount: 0,
    members: [],
    sharedProperties: [],
    isPrototype: true,
  };
}

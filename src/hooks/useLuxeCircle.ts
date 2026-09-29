// File responsibility: Luxe Circle state (prototype). Returns the prototype
// empty Circle so the UI renders honest empty states. Swap the return value
// (never the shape) when a real Circle source exists.
"use client";
import { getPrototypeCircle } from "@/lib/circle/circle-model";
import type { LuxeCircleSummary } from "@/types/circle";

export function useLuxeCircle(): LuxeCircleSummary {
  return getPrototypeCircle();
}

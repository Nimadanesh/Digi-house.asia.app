// File responsibility: resolve the TonConnect manifest URL to an absolute HTTPS URL (TonConnect requirement).
// Pure helper; safe on server (returns the configured value) and browser (prefixes window.location.origin).
import { env } from "@/lib/env";

export function resolveManifestUrl(): string {
  const { manifestUrl } = env;
  if (/^https?:\/\//i.test(manifestUrl)) return manifestUrl;
  if (!browserWindow()) return manifestUrl;
  return `${window.location.origin}${manifestUrl.startsWith("/") ? "" : "/"}${manifestUrl}`;
}

function browserWindow(): boolean {
  return typeof window !== "undefined" && typeof window.location?.origin === "string";
}
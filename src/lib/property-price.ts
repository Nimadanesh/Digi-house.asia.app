// File responsibility: THE single source of truth for "current share price" on any
// property surface. UI components must call this — never re-derive from raw fields.
//
// Price priority hierarchy (REDESIGN-SPEC Phase 4 coherence fix):
//   1. Primary (status "funding"):  sharePriceUsd          — one fixed offering price
//   2. Secondary (funded/resale):   bestAskUsd             — live market ask, when a book exists
//                                   ?? lastTradeUsd        — last executed fill (PD-07)
//                                   ?? sharePriceUsd       — list price fallback (thin/empty book)
//
// Rules:
// - Money in/out is integer minor units (cents). No rounding beyond what upstream data has.
// - The order book and recent trades are *market context*; they may show surrounding depth,
//   but their centre of mass must be derived from this same price (see mock/orderbook.ts).
// - The performance chart anchors its final point to this exact value.
import type { Listing } from "@/types/property";

export function getCurrentSharePrice(
  listing: Pick<Listing, "status" | "sharePriceUsd" | "lastTradeUsd">,
  book?: { bestAskUsd?: number },
): number {
  if (listing.status === "funding") return listing.sharePriceUsd;
  return book?.bestAskUsd ?? listing.lastTradeUsd ?? listing.sharePriceUsd;
}

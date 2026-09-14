// File responsibility: PO-supplied editorial copy for the Estate tab "Why this
// estate" hero card (revision contract 2026-09-13). ADDITIVE and sparse: an
// entry exists ONLY where the product owner approved the exact wording
// (villa 1 first). Every other villa resolves to null and the section falls
// back to its adopted dataset description — nothing is authored here.
import type { EstateEditorial } from "@/types/estate-page-data";

export const ESTATE_EDITORIAL: Readonly<Record<number, EstateEditorial>> = {
  1: {
    estateId: 1,
    headline: "One of the most exclusive 2-bedroom ocean pool villas at JOALI Being.",
    body: "Luxurious overwater villa with a private infinity pool and expansive indoor-outdoor spaces, designed for high-end short stays.",
    highlights: [
      "Private infinity ocean pool",
      "Overwater location at JOALI Being",
      "Full privacy on a wellbeing island",
      "Built for premium short-term stays",
    ],
  },
};

/** PO editorial for one villa, or null when none is approved yet. */
export function getEstateEditorial(estateId: number): EstateEditorial | null {
  return ESTATE_EDITORIAL[estateId] ?? null;
}

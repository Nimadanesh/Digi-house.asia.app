// File responsibility: Estate tab §1 highlight derivation (Estate Page Structure
// §4.1, PO directive "no invented data") — derives up to four highlight points
// for a villa FROM ITS OWN ADOPTED DATA: verbatim amenity/service strings from
// the Estate24 record plus the locked D7 location highlight. Deterministic
// pick order (pool → beach/water → chef/staff → location highlight → first
// general amenity); labels are dataset text, never authored copy.
import type { Estate24Record } from "@/types/estate-24-data";
import type { EstateHighlight, EstateLocationDetail } from "@/types/estate-page-data";

function firstMatch(labels: readonly string[], pattern: RegExp): string | null {
  return labels.find((l) => pattern.test(l)) ?? null;
}

export function getEstateHighlights(
  record: Estate24Record,
  locationDetail: EstateLocationDetail | null,
): readonly EstateHighlight[] {
  const amenities = [...record.amenities.general, ...record.amenities.outdoor, ...record.amenities.indoor];
  const services = [...record.services.included, ...record.services.staff];
  const picks: EstateHighlight[] = [];
  const push = (kind: EstateHighlight["kind"], label: string | null) => {
    if (label == null) return;
    if (picks.some((p) => p.label === label)) return;
    picks.push({ id: `hl-${picks.length + 1}`, label, kind });
  };

  push("pool", firstMatch(amenities, /pool|jacuzzi/i));
  push("beach", firstMatch(amenities, /beach|ocean|sea |lakefront|waterfront/i));
  push("chef", firstMatch(services, /chef|butler|housekeeping|staff/i));
  if (locationDetail?.highlight) push("note", locationDetail.highlight);
  push("note", firstMatch(amenities, /.*/) ?? null);

  return picks.slice(0, 4);
}

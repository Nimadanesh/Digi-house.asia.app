// File responsibility: D2/D3/D4 locked legal layer (Estate Page Structure §8,
// PO decision 2026-09-13) — per-villa Legal & Structure records for the Details
// tab: legal structure text (D2), standard insurance coverage (D3), and the
// launch valuation date/method (D4). Texts are locked verbatim; the Maldives
// text is keyed to estateId 1 ONLY and must never render on other villas.
// ADDITIVE data module only: no UI wiring, no engine involvement.
import type {
  EstateLegalStructureRecord,
  EstateValuationMethod,
} from "@/types/estate-page-data";
import { getEstate24ByRuntimeId } from "./estate-24-data";

/** D2 — Maldives dedicated legal text (CONFIRMED, estateId 1 only). */
const MALDIVES_LEGAL_TEXT =
  "Each villa is held in a dedicated property SPV that holds a long-term leasehold interest under the resort's 50-year government head-lease (Maldives Tourism Act). Investors acquire shares in the SPV proportionate to their fraction — not direct land title, as Maldivian law reserves land title to Maldivians/state. Rights, usage calendar, rental pooling, resale and resort obligations are governed by the Shareholder Agreement + Resort Management Agreement. Remaining lease term and renewal terms are disclosed per villa.";

/** D2 — generic SPV template for the 23 non-Maldives villas (isEstimate: true
 *  until per-jurisdiction texts are written). */
const GENERIC_LEGAL_TEXT =
  "Each villa is held in a dedicated property SPV. Investors acquire shares in the SPV. Underlying tenure, rights, usage and resale are governed by the Shareholder Agreement + local property/management agreements applicable to the jurisdiction. Full details are disclosed in the Documents section.";

/** D3 — standard resort/SPV insurance coverage (CONFIRMED standard; per-villa
 *  insurer/policy year TBC until real certificates exist). */
const INSURANCE_COVERAGE_TEXT =
  "The villa (via resort/SPV) is covered by: (1) All-risks property incl. fire, storm, flood; (2) Contents & FF&E; (3) Public / guest liability ($1–2M per occurrence benchmark); (4) Business interruption / loss of rental income; (5) Machinery & equipment breakdown; (6) Employer & contractor cover during works. Certificates renewed annually; copies in Documents. Excludes wear-and-tear, wilful acts, war/nuclear per standard wording. Deductibles apply.";

/** D4 — launch valuation method. The generic valuer phrase is locked; firm
 *  names must never appear. */
const VALUATION_METHOD: EstateValuationMethod = {
  valuationDate: "2024-12-31",
  dateIsEstimate: true,
  dateNote: "APPROX — roll to 31 Dec 2025 at launch",
  method: "RICS-aligned Market Value — Income (DCF over remaining head-lease, 11% discount) cross-checked to prime resort comparables",
  valuer: "Independent RICS-registered valuer",
  basis: "leasehold with vacant possession, inclusive of FF&E",
  isEstimate: true,
};

/** The 24 per-villa Legal & Structure records (estateId 1–24). */
export const ESTATE_LEGAL_STRUCTURE: readonly EstateLegalStructureRecord[] = Array.from(
  { length: 24 },
  (_, i) => {
    const estateId = i + 1;
    return {
      estateId,
      legal: {
        isMaldives: estateId === 1,
        text: estateId === 1 ? MALDIVES_LEGAL_TEXT : GENERIC_LEGAL_TEXT,
        isEstimate: estateId !== 1,
      },
      insurance: {
        coverage: INSURANCE_COVERAGE_TEXT,
        insurer: null, // TBC per villa
        policyYear: null, // TBC per villa
        isEstimate: true,
      },
      valuation: VALUATION_METHOD,
    };
  },
);

const LEGAL_BY_ESTATE_ID: ReadonlyMap<number, EstateLegalStructureRecord> = new Map(
  ESTATE_LEGAL_STRUCTURE.map((r) => [r.estateId, r]),
);

/** Legal & Structure record for one villa, by Estate24 record id (1–24). */
export function getLegalStructureByEstate24Id(estateId: number): EstateLegalStructureRecord | null {
  return LEGAL_BY_ESTATE_ID.get(estateId) ?? null;
}

/** Legal & Structure record for one villa, by runtime propertyId. */
export function getLegalStructureByPropertyId(propertyId: string): EstateLegalStructureRecord | null {
  const record = getEstate24ByRuntimeId(propertyId);
  return record ? getLegalStructureByEstate24Id(record.id) : null;
}

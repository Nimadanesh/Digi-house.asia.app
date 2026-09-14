// File responsibility: type layer for the Estate-page additive data wave — the
// locked D1–D11 decisions (2026-09-13, Estate Page Structure §8). Leaf layer:
// imports nothing. Every APPROX/assumed field carries an explicit
// `isEstimate` (or status) flag — no invented data enters these records.

// ── D1 — Operator / Villa Specialists ────────────────────────────────────────

/** One locked Rental Escapes Villa Specialist (mirrored verbatim from
 *  d1-rental-escapes-specialists.json; photos localized to /public). */
export interface EstateVillaSpecialist {
  /** Locked specialist id, "D1-01" … "D1-12". */
  id: string;
  fullName: string;
  title: string;
  /** Local public asset path (photosLocalized: true; no CDN URLs remain). */
  photoUrl: string;
  bio: string;
  /** Locked assignment string, verbatim ("villas 1-2" … "villas 23-24"). */
  assignTo: string;
}

/** Locked Rental Escapes operator facts (D1 CONFIRMED). */
export interface EstateOperatorCompany {
  name: string;
  kind: string;
  headquarters: string;
  phone: string;
  email: string;
  portfolioClaim: string;
  leadership: readonly { name: string; role: string }[];
  /** Ready UI summary line (locked D1 wording). */
  summaryLine: string;
  source: string;
}

/** Operator assignment resolved for one villa (each specialist owns 2 villas). */
export interface EstateOperatorAssignment {
  company: EstateOperatorCompany;
  specialist: EstateVillaSpecialist;
}

// ── D7 — Location / transfer details ─────────────────────────────────────────

export type EstateTransferStatus = "CONFIRMED" | "APPROX";

export interface EstateTransferInfo {
  text: string;
  status: EstateTransferStatus;
  /** True exactly when status === "APPROX" (locked rule: verify at booking). */
  isEstimate: boolean;
}

/** One villa's location detail (D7 — location hierarchy CONFIRMED, transfer
 *  times CONFIRMED where cited, else APPROX). No map asset exists yet. */
export interface EstateLocationDetail {
  /** Estate24 record id (1–24) — the locked join key. */
  estateId: number;
  /** Exact location text for UI. */
  locationText: string;
  islandOrResort: string;
  region: string;
  transfer: EstateTransferInfo;
  /** Row highlight, verbatim where supplied. */
  highlight?: string;
  /** Row note, verbatim where supplied (e.g. legal flags). */
  note?: string;
}

/** One derived "Why this estate" highlight point (Estate Page Structure §4.1).
 *  Labels are verbatim dataset strings; the kind picks the presentation icon. */
export interface EstateHighlight {
  id: string;
  label: string;
  kind: "pool" | "beach" | "chef" | "note";
}

/**
 * PO-supplied editorial copy for the "Why this estate" hero card (revision
 * contract 2026-09-13). Present only where the product owner approved exact
 * wording (villa 1 first); every other villa falls back to its adopted
 * dataset description until its editorial lands. Never invented per villa.
 */
export interface EstateEditorial {
  estateId: number;
  /** One-line headline for the highlighted card. */
  headline: string;
  /** Max two-line supporting body. */
  body: string;
  /** Up to four highlight labels (rendered in the IconPointsGrid). */
  highlights: readonly string[];
}

// ── D2 / D3 / D4 — Legal structure, insurance, valuation method ──────────────

export interface EstateLegalStructure {
  /** True only for the Maldives villa (estateId 1) — locked dedicated text. */
  isMaldives: boolean;
  text: string;
  isEstimate: boolean;
}

export interface EstateInsurance {
  /** Shared standard-coverage text (D3). */
  coverage: string;
  /** Per-villa insurer — TBC until real certificates exist. */
  insurer: string | null;
  policyYear: string | null;
  isEstimate: boolean;
}

export interface EstateValuationMethod {
  /** ISO date of the launch valuation (D4). */
  valuationDate: string;
  /** True until real per-villa valuations land (roll to 2025-12-31 at launch). */
  dateIsEstimate: boolean;
  /** Locked launch-date note, verbatim. */
  dateNote: string;
  method: string;
  /** Locked generic phrase only — never a specific firm name. */
  valuer: string;
  basis: string;
  isEstimate: boolean;
}

/** Per-villa Legal & Structure record (Details tab §7.2). */
export interface EstateLegalStructureRecord {
  estateId: number;
  legal: EstateLegalStructure;
  insurance: EstateInsurance;
  valuation: EstateValuationMethod;
}

// ── D5 / D6 / D8 / D10 / D11 — locked shared disclosures ─────────────────────

/** One locked document title (D5). "[Villa Name]" is a render placeholder —
 *  the canonical villa name substitutes at render time. */
export interface EstateDocumentTitle {
  id: number;
  title: string;
}

/** One locked risk disclosure (D6). */
export interface EstateRiskDisclosure {
  id: number;
  title: string;
  text: string;
}

/** Locked long-term growth assumption (D10 — illustrative, never a forecast). */
export interface EstateGrowthAssumption {
  minPctPerYear: number;
  maxPctPerYear: number;
  displayLabel: string;
  source: string;
  evidence: string;
  /** Locked verbatim paragraph. */
  paragraph: string;
  isEstimate: true;
}

/** D8 — no public per-villa historical data exists (CONFIRMED). */
export interface EstateHistoricalPerformanceDisclosure {
  unavailableLine: string;
  pendingLine: string;
}

/** D11 investor-facing owner-tax disclosure (shared). */
export interface EstateOwnerTaxDisclosure {
  /** Locked verbatim paragraph (includes the not-tax-advice disclaimer). */
  paragraph: string;
  /** Maldives-specific supplement (id 1 only). */
  maldivesNote: string;
}

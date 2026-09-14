// File responsibility: locked shared disclosure constants for the Estate page
// (Estate Page Structure §8, PO decision 2026-09-13) — the D5 document-title
// list, D6 risk disclosures, D8 historical-performance disclosure, D10 growth
// assumption, and the D11 investor-facing owner-tax disclosure. All content is
// locked verbatim; APPROX/assumed items carry isEstimate flags. Rendering stays
// honest-pending until real per-villa artifacts (PDFs, certificates) exist.
import type {
  EstateDocumentTitle,
  EstateGrowthAssumption,
  EstateHistoricalPerformanceDisclosure,
  EstateOwnerTaxDisclosure,
  EstateRiskDisclosure,
} from "@/types/estate-page-data";

/**
 * D5 — locked document list (10 titles, exact order). "[Villa Name]" is a
 * render-time placeholder for the canonical villa name. No real PDFs exist
 * yet — rows render as pending until the files land (never fake downloads).
 */
export const ESTATE_DOCUMENTS_AVAILABLE = false;

export const ESTATE_DOCUMENT_TITLES: readonly EstateDocumentTitle[] = [
  { id: 1, title: "Shareholder Agreement (SPV)" },
  { id: 2, title: "Property Valuation Report" },
  { id: 3, title: "Resort Management Agreement" },
  { id: 4, title: "Insurance Certificate" },
  { id: 5, title: "Title / Head-Lease Extract" },
  { id: 6, title: "Rental Pool & Revenue Share Schedule" },
  { id: 7, title: "House Rules & Usage Calendar" },
  { id: 8, title: "Risk Disclosure Statement" },
  { id: 9, title: "Fees & Operating Budget" },
  { id: 10, title: "Exit / Resale & Transfer Procedure" },
];

/** D6 — the six locked risk disclosures (shared across all 24 villas). */
export const ESTATE_RISK_DISCLOSURES: readonly EstateRiskDisclosure[] = [
  {
    id: 1,
    title: "Market & occupancy risk",
    text: "Luxury short-stay demand is seasonal/cyclical; occupancy and ADR can fall, reducing rental distributions.",
  },
  {
    id: 2,
    title: "Leasehold & regulatory risk",
    text: "Interests may be leasehold (not freehold); renewal, government policy, tax changes can affect returns.",
  },
  {
    id: 3,
    title: "Currency & cost risk",
    text: "Revenue and costs in different currencies; FX, local taxes, maintenance levies may rise.",
  },
  {
    id: 4,
    title: "Liquidity & resale risk",
    text: "Fractions are illiquid; secondary sales need buyer match and SPV/resort consent; price may be below purchase.",
  },
  {
    id: 5,
    title: "Operational & climate risk",
    text: "Resort operations, weather disruption, maintenance downtime can pause income; insurance has exclusions/deductibles.",
  },
  {
    id: 6,
    title: "No guarantee",
    text: "Projections and past performance are not guarantees of future yield or capital growth.",
  },
];

/** D8 — no public per-villa historical dataset exists (CONFIRMED). */
export const ESTATE_HISTORICAL_PERFORMANCE: EstateHistoricalPerformanceDisclosure = {
  unavailableLine: "Historical occupancy: Not publicly disclosed",
  pendingLine: "Data will be available after first 12 months of operation.",
};

/** D10 — locked growth assumption (illustrative, never a forecast). */
export const ESTATE_GROWTH_ASSUMPTION: EstateGrowthAssumption = {
  minPctPerYear: 3,
  maxPctPerYear: 5,
  displayLabel: "+3% to +5% per year",
  source: "Knight Frank PIRI",
  evidence: "Knight Frank PIRI prime residential +3.1% (2023), +3.6% (2024)",
  paragraph:
    "Assumed long-term capital growth 3–5% p.a. for prime resort villas, before fees/FX/lease decay. Reference: Knight Frank PIRI prime residential +3.1% (2023), +3.6% (2024). Illustrative only, not a forecast.",
  isEstimate: true,
};

/** D11 — investor-facing owner-tax disclosure (shared; the per-jurisdiction
 *  rates live in the V1 tax table with status ASSUMPTION). */
export const ESTATE_OWNER_TAX_DISCLOSURE: EstateOwnerTaxDisclosure = {
  paragraph:
    "Rental income distributed via the SPV is subject to local tax rules of the property jurisdiction. Approximate effective rates on net rental income range from 0% to 55% depending on location, residency status and deductions. TGST/Green Tax (where applicable) are collected on stays and are separate. Resale may trigger capital-gains rules. Home-country tax still applies. This is not tax advice — seek personal advice.",
  maldivesNote:
    "Maldives supplement: ~10% non-resident withholding applies to net rental income. TGST and Green Tax are charged on guest stays and are separate from owner-side tax.",
};

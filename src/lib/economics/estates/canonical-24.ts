// File responsibility: R2 Canonical Estate Data Layer — the single coherent source of
// truth for the 24 marketplace estates (R2 output A) plus the machine-readable
// reconciliation propertyId → Rental Escapes Listing ID → canonical estate (output B).
//
// ADDITIVE ONLY: no existing registry, fixture, manifest record, UI component, or
// settlement path is modified by this file. Both existing ID sets are preserved
// untouched:
//   - web runtime + tests: 24 legacy `prop-*` fixture IDs (this layer keys on them);
//   - API/DB seed: 24 manifest IDs from `portfolio-manifest.json` (not keyed here,
//     not renamed, not reordered — see the R2 legacy audit in the test file).
//
// Mapping basis (no similarity guessing): each record joins the existing fixture
// (whose title/location/rate/image-slug already carry the Rental Escapes identity in
// 1:1 dataset order) to the EXPLICIT Source URL + Rental Escapes Listing ID from
// `docs/product/rebuild/research/24-PROPERTY-RESEARCH-DATASET.md`.
// Observed identity fields (name/location/rate/images) are Rental Escapes facts.
// FractionalLuxe economics are a separate layer with explicit provenance.
// Valuations (PM decision 2026-09-09 lowest-valid-value rule, supersedes the R2
// UNKNOWN default and the prior midpoint decision): Grand 2 BDM keeps the
// approved ~$8–10M band low as the canonical $8M value; the other 23 carry
// their research-band LOW ends as approved ESTIMATED/MODELED product values
// (La Dolce Vita $32M single point), ranges preserved verbatim in research
// context. Legacy $82M stays CONFLICTED evidence; nothing is labeled observed/exact.
// Legacy $82M stays CONFLICTED evidence; nothing is labeled observed/exact.

import type {
  CanonicalMarketplaceEstate,
  CanonicalProvenance,
  CanonicalReconciliationRow,
  RentalRateType,
  ResearchConfidence,
} from "@/types/estate-canonical";

/** Reproduce the existing-app gallery URL pattern exactly (prefix + 2-digit index). */
function gallery(prefix: string, count: number): string[] {
  return Array.from(
    { length: count },
    (_, i) => `/images/properties/${prefix}-${String(i + 1).padStart(2, "0")}.jpg`,
  );
}

interface EstateRow {
  propertyId: string;
  listingId: string;
  sourceUrl: string;
  name: string;
  location: string;
  galleryPrefix: string;
  galleryCount: number;
  rateDisplay: string;
  rateType: RentalRateType;
  size: string | null;
  sizeProvenance?: CanonicalProvenance;
  beds: string | null;
  baths: string | null;
  guests: string | null;
  seasonality: string | null;
  estimatedValueText: string;
  confidence: ResearchConfidence;
  fixtureShares: number;
  fixtureSharePriceUsd: number;
  fixtureStatus: "funding" | "funded" | "resale";
  valuationUsd?: number | null;
  valuationSource?: string;
  legacyNote?: string;
}

function buildRow(row: EstateRow): CanonicalMarketplaceEstate {
  const listingSource = `rental-escapes-listing:${row.listingId}`;
  return {
    propertyId: row.propertyId,
    rentalEscapesListingId: row.listingId,
    rentalEscapesSourceUrl: row.sourceUrl,
    name: { value: row.name, provenance: "observed", source: listingSource },
    location: { value: row.location, provenance: "observed", source: listingSource },
    images: {
      urls: gallery(row.galleryPrefix, row.galleryCount),
      provenance: "observed",
      source: `existing-app-fixture:${row.propertyId} (R2 §2 starting inventory identity)`,
    },
    observedRentalRate: {
      display: row.rateDisplay,
      rateType: row.rateType,
      provenance: "observed",
      source: listingSource,
    },
    research: {
      sizeText: {
        value: row.size,
        provenance: row.sizeProvenance ?? (row.size == null ? "unknown" : "observed"),
        source: "research-dataset",
      },
      bedsText: {
        value: row.beds,
        provenance: row.beds == null ? "unknown" : "observed",
        source: "research-dataset",
      },
      bathsText: {
        value: row.baths,
        provenance: row.baths == null ? "unknown" : "observed",
        source: "research-dataset",
      },
      guestsText: {
        value: row.guests,
        provenance: row.guests == null ? "unknown" : "observed",
        source: "research-dataset",
      },
      seasonality: {
        value: row.seasonality,
        provenance: row.seasonality == null ? "unknown" : "observed",
        source: "research-dataset",
      },
      estimatedValueText: row.estimatedValueText,
      estimatedValueProvenance: "estimated",
      researchConfidence: row.confidence,
    },
    fractionalLuxe: {
      valuationUsd: row.valuationUsd == null
        ? {
          value: null,
          provenance: "unknown",
          source: "fractionaluxe-estimate-pending (no product-owner estimate given)",
        }
        : {
          value: row.valuationUsd,
          provenance: "estimated",
          source: row.valuationSource ?? "product-owner-r2-approval",
        },
      occupancyRate: {
        value: null,
        provenance: "unknown",
        source: "research-dataset: occupancy UNKNOWN (no FractionalLuxe assumption introduced)",
      },
      annualIncomeUsd: {
        value: null,
        provenance: "unknown",
        source: "withheld: no explicit occupancy assumption exists (R2 §5)",
      },
      existingFixture: {
        propertyId: row.propertyId,
        totalShares: row.fixtureShares,
        sharePriceUsd: row.fixtureSharePriceUsd,
        status: row.fixtureStatus,
        provenance: "observed",
        source: `existing-app-fixture:${row.propertyId} (trading params by reference, not canonical economics)`,
      },
    },
    legacyEvidence: row.legacyNote
      ? { note: row.legacyNote, provenance: "conflicted" }
      : null,
    reconciliationStatus: "MAPPED",
  };
}

/**
 * The 24 canonical marketplace estates, in research-dataset order (#1–#24).
 * Observed strings are verbatim from the research dataset; gallery counts reproduce
 * the existing-app fixture galleries exactly (asserted by tests).
 */
const ROWS: readonly EstateRow[] = [
  {
    propertyId: "prop-marina-vista-4b",
    listingId: "128862",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-asia/maldives/bodufushi/joali-being/grand-2-bdm-ocean-pool-villa-128862",
    name: "Grand 2 BDM Ocean Pool Villa (JOALI Being)",
    location: "Bodufushi, JOALI Being, Raa Atoll, Maldives",
    galleryPrefix: "joali-being",
    galleryCount: 33,
    rateDisplay: "$67,655–$76,458",
    rateType: "RANGE",
    size: "382 m² total; 159 m² interior; 33 m² pool",
    beds: "2",
    baths: "2",
    guests: "5",
    seasonality:
      "Dry Maldives season roughly Nov–Apr busier; May–Oct wetter/lower demand. Overwater luxury villa, private infinity pool, lagoon access, wellbeing/family positioning.",
    estimatedValueText: "$12–15M; $9.6–18M",
    confidence: "MEDIUM",
    fixtureShares: 2500,
    fixtureSharePriceUsd: 10000,
    fixtureStatus: "funding",
    // Approved band ~$8–10M ESTIMATED/MODELED; existing canonical $8M seed retained.
    valuationUsd: 800_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: approved $8-10M band low = $8M ESTIMATED/MODELED (research $12-15M stays research context)",
    legacyNote:
      "Legacy fixture totalValueUsd $82M retained as LEGACY/CONFLICTED evidence only; must never enter canonical economics.",
  },
  {
    propertyId: "prop-soho-loft-studio",
    listingId: "126855",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/british-virgin-islands/buck-island/the-aerial-126855",
    name: "The Aerial",
    location: "Buck Island, British Virgin Islands",
    galleryPrefix: "the-aerial",
    galleryCount: 49,
    rateDisplay: "$52,200–$75,800+",
    rateType: "RANGE",
    size: "Main house ~2,787 m²; island ~43–44 ha",
    beds: "17",
    baths: "17+",
    guests: "32",
    seasonality:
      "Nov–Apr high season; summer/early fall lower. Private island, wellness, local food, water activities, horses, full staff.",
    estimatedValueText: "$18–22M; $14.4–26.4M",
    confidence: "MEDIUM",
    fixtureShares: 1000,
    fixtureSharePriceUsd: 12000,
    fixtureStatus: "funding",
    valuationUsd: 1_800_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $18-22M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-bayside-marina-penthouse",
    listingId: "108924",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-vacation-rentals-europe/italy/amalfi-coast/sorrento/villa-syrene-108924",
    name: "Syrene (Villa Syrene)",
    location: "Sorrento, Amalfi Coast, Italy",
    galleryPrefix: "villa-syrene",
    galleryCount: 42,
    rateDisplay: "~€40,000",
    rateType: "APPROXIMATE",
    size: null,
    beds: "6",
    baths: "6",
    guests: "12",
    seasonality:
      "Summer and Italian holidays busier; fall/winter quieter. Neoclassical cliff villa, 270° Gulf of Naples view, private garden/sea access, chef/housekeeper.",
    estimatedValueText: "$12–16M; $9.6–19.2M",
    confidence: "MEDIUM",
    fixtureShares: 2500,
    fixtureSharePriceUsd: 12000,
    fixtureStatus: "funded",
    valuationUsd: 1_200_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $12-16M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-alfama-terrace-flat",
    listingId: "123861",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-vacation-rentals-europe/france/french-riviera/saint-jean-cap-ferrat/villa-du-cap-123861",
    name: "Villa du Cap",
    location: "Saint-Jean-Cap-Ferrat, French Riviera, France",
    galleryPrefix: "villa-du-cap",
    galleryCount: 8,
    rateDisplay: "~€38,575",
    rateType: "APPROXIMATE",
    size: null,
    beds: "4",
    baths: "4",
    guests: "8",
    seasonality:
      "Summer, Cannes festival and Monaco GP busier. Mediterranean views, infinity pool, private tennis, sauna, gym, housekeeper/butler.",
    estimatedValueText: "$25–35M; $20–42M",
    confidence: "MEDIUM",
    fixtureShares: 1000,
    fixtureSharePriceUsd: 10500,
    fixtureStatus: "funded",
    valuationUsd: 2_500_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $25-35M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-tbilisi-riverhouse-loft",
    listingId: "125643",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/turks-and-caicos/providenciales/silly-creek/emerald-cay-125643",
    name: "Emerald Cay",
    location: "Silly Creek, Providenciales, Turks and Caicos",
    galleryPrefix: "emerald-cay",
    galleryCount: 39,
    rateDisplay: "$35,714–~$50,000",
    rateType: "RANGE",
    size: "~30,000 ft² / ~2,787 m²; private island 2+ ha",
    beds: "8",
    baths: "8+",
    guests: "16",
    seasonality:
      "Dec–Apr busier; summer quieter. Private island, drawbridge, multiple pools, theatre, 6,000-bottle wine cellar, tennis, gym.",
    estimatedValueText: "$28–35M; $22.4–42M",
    confidence: "MEDIUM",
    fixtureShares: 600,
    fixtureSharePriceUsd: 12000,
    fixtureStatus: "resale",
    valuationUsd: 2_800_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $28-35M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-canggu-surf-villa",
    listingId: "130393",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/british-virgin-islands/moskito-island/the-branson-beach-estate-130393",
    name: "The Branson Beach Estate",
    location: "Moskito Island, British Virgin Islands",
    galleryPrefix: "the-branson-beach-estate",
    galleryCount: 38,
    rateDisplay: "~$35,000",
    rateType: "APPROXIMATE",
    size: "Main page UNKNOWN; island 125 ha",
    beds: "11",
    baths: "11",
    guests: "22",
    seasonality:
      "Nov–Apr and holidays busier. Three connected villas on Moskito Island, private beach, pools, island amenities, barefoot luxury.",
    estimatedValueText: "$30–40M; $24–48M",
    confidence: "MEDIUM",
    fixtureShares: 1200,
    fixtureSharePriceUsd: 15000,
    fixtureStatus: "resale",
    valuationUsd: 3_000_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $30-40M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-tokyo-shibuya-studio",
    listingId: "130901",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-vacation-rentals-europe/austria/tyrol/kitzbuhel/chalet-montana-130901",
    name: "Chalet Montana",
    location: "Kitzbühel, Tyrol, Austria",
    galleryPrefix: "chalet-montana",
    galleryCount: 63,
    rateDisplay: "~€27,571",
    rateType: "APPROXIMATE",
    size: null,
    beds: "8",
    baths: "9",
    guests: "16",
    seasonality:
      "Winter ski season busiest; summer quieter. Luxury chalet, advanced spa, sauna, steam room, plunge pool, full staff.",
    estimatedValueText: "$12–18M; $9.6–21.6M",
    confidence: "MEDIUM",
    fixtureShares: 1200,
    fixtureSharePriceUsd: 11000,
    fixtureStatus: "funding",
    valuationUsd: 1_200_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $12-18M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-brooklyn-brownstone-flat",
    listingId: "131293",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/st-barthelemy/saint-jean/villa-bdm-131293",
    name: "Villa BDM",
    location: "Saint Jean Beach, St. Barthelemy",
    galleryPrefix: "villa-bdm",
    galleryCount: 67,
    rateDisplay: "~$25,714",
    rateType: "APPROXIMATE",
    size: null,
    beds: "7",
    baths: "8",
    guests: "14",
    seasonality:
      "Dec–Apr busier. Beachfront St-Jean villa, pool, fitness room, professional kitchen, terraces, direct beach access.",
    estimatedValueText: "$18–25M; $14.4–30M",
    confidence: "MEDIUM",
    fixtureShares: 800,
    fixtureSharePriceUsd: 13000,
    fixtureStatus: "funding",
    valuationUsd: 1_800_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $18-25M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-berlin-mitte-apartment",
    listingId: "128529",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-vacation-rentals-usa/nevada/las-vegas/caesars-palace/trajan-128529",
    name: "Trajan Villa at Caesars Palace",
    location: "Caesars Palace, Las Vegas, Nevada, USA",
    galleryPrefix: "trajan",
    galleryCount: 9,
    rateDisplay: "from ~$25,000",
    rateType: "STARTING_FROM",
    size: "10,400 ft² / ~966 m²",
    beds: "3",
    baths: "3.5",
    guests: "6",
    seasonality:
      "Weekends, conventions and holidays busier. Tuscan-style Caesars Palace villa, fireplace, billiards, media room, aquarium, courtyard, plunge pool and jacuzzi.",
    estimatedValueText: "$8–12M; $6.4–14.4M",
    confidence: "MEDIUM",
    fixtureShares: 1600,
    fixtureSharePriceUsd: 9500,
    fixtureStatus: "funding",
    valuationUsd: 800_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $8-12M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-barcelona-eixample-flat",
    listingId: "123320",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-vacation-rentals-mexico/los-cabos/cabo/pedregal/villa-la-datcha-123320",
    name: "La Datcha (Villa La Datcha)",
    location: "Pedregal, Cabo San Lucas, Los Cabos, Mexico",
    galleryPrefix: "villa-la-datcha",
    galleryCount: 40,
    rateDisplay: "$23,750–$43,750",
    rateType: "RANGE",
    size: null,
    beds: "10",
    baths: "10",
    guests: "20",
    seasonality:
      "Nov–Apr busier; Aug–Oct noted as closed for storm season. Three connected buildings, infinity pool, gym/spa, whale watching, full staff.",
    estimatedValueText: "$15–20M; $12–24M",
    confidence: "MEDIUM",
    fixtureShares: 1000,
    fixtureSharePriceUsd: 10500,
    fixtureStatus: "funding",
    valuationUsd: 1_500_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $15-20M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-london-camden-loft",
    listingId: "109098",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-vacation-rentals-europe/italy/lombardy/lake-como/galeazzo-109098",
    name: "Galeazzo (Villa Galeazzo)",
    location: "Tremezzo, Lake Como, Lombardy, Italy",
    galleryPrefix: "galeazzo",
    galleryCount: 23,
    rateDisplay: "$18,000–$24,000",
    rateType: "RANGE",
    size: null,
    beds: "6",
    baths: "6",
    guests: "12",
    seasonality:
      "Summer/early fall busier. Historic 16th–17th century palazzo, private dock, formal gardens, heated pool, antiques, full staff.",
    estimatedValueText: "$12–18M; $9.6–21.6M",
    confidence: "MEDIUM",
    fixtureShares: 900,
    fixtureSharePriceUsd: 14000,
    fixtureStatus: "resale",
    valuationUsd: 1_200_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $12-18M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-sydney-harbour-apartment",
    listingId: "127825",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/st-barthelemy/gustavia/embrace-127825",
    name: "Embrace",
    location: "Gustavia Heights, St. Barthelemy",
    galleryPrefix: "embrace",
    galleryCount: 58,
    rateDisplay: "~$21,428",
    rateType: "APPROXIMATE",
    size: null,
    beds: "5",
    baths: "5",
    guests: "10",
    seasonality:
      "Dec–Apr busier. Contemporary luxury villa, two infinity pools, cinema, games room, hammam, massage room, panoramic sunset.",
    estimatedValueText: "$35–45M; $28–54M",
    confidence: "MEDIUM",
    fixtureShares: 700,
    fixtureSharePriceUsd: 15000,
    fixtureStatus: "resale",
    valuationUsd: 3_500_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $35-45M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-toronto-condo",
    listingId: "122422",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/dominican-republic/cabrera/ani-dominican-republic-122422",
    name: "ANI Dominican Republic",
    location: "Cabrera, North Coast, Dominican Republic",
    galleryPrefix: "ani-dominican-republic",
    galleryCount: 47,
    rateDisplay: "~$27,000",
    rateType: "APPROXIMATE",
    size: "land stated as ~4.2 ha; source text also says 1.7 ha (CONFLICTED)",
    sizeProvenance: "conflicted",
    beds: "14",
    baths: "14",
    guests: "28",
    seasonality:
      "Dry Caribbean season busier. Private resort, two villas, infinity pools, tennis, wellness, private beach, 30+ staff, all-inclusive.",
    estimatedValueText: "$50–70M; $40–84M",
    confidence: "MEDIUM",
    fixtureShares: 1100,
    fixtureSharePriceUsd: 12000,
    fixtureStatus: "resale",
    valuationUsd: 5_000_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $50-70M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-melbourne-loft",
    listingId: "129548",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-vacation-rentals-mexico/punta-mita/ranchos-estates/mita-principe-129548",
    name: "Mita Principe",
    location: "Ranchos Estates, Punta Mita, Mexico",
    galleryPrefix: "mita-principe",
    galleryCount: 90,
    rateDisplay: "~$20,000",
    rateType: "APPROXIMATE",
    size: "25,000 ft² / ~2,323 m²",
    beds: "9",
    baths: "9",
    guests: "18",
    seasonality:
      "Nov–Apr busier. Beachfront estate, heated infinity pool, Dolby Atmos cinema, rooftop sky bar, private spa and Technogym.",
    estimatedValueText: "$25–35M; $20–42M",
    confidence: "MEDIUM",
    fixtureShares: 1000,
    fixtureSharePriceUsd: 10000,
    fixtureStatus: "funded",
    valuationUsd: 2_500_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $25-35M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-miami-beach-condo",
    listingId: "122903",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/turks-and-caicos/providenciales/long-bay/la-dolce-vita--122903",
    name: "La Dolce Vita",
    location: "Long Bay, Providenciales, Turks and Caicos",
    galleryPrefix: "la-dolce-vita",
    galleryCount: 67,
    rateDisplay: "DYNAMIC / exact dates required",
    rateType: "DYNAMIC",
    size: "12,300+ ft² interior; 430 ft private beach",
    beds: "9",
    baths: "9+",
    guests: "18",
    seasonality:
      "Dec–Apr busier. Classic New England architecture, long private beach, ocean-view pools, jacuzzi, gym, separate guest house.",
    estimatedValueText: "$32M; $25.6–38.4M",
    confidence: "HIGH",
    fixtureShares: 800,
    fixtureSharePriceUsd: 13500,
    fixtureStatus: "resale",
    valuationUsd: 3_200_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: single $32M point adopted ESTIMATED/MODELED (HIGH confidence)",
  },
  {
    propertyId: "prop-istanbul-bosphorus-flat",
    listingId: "126870",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/turks-and-caicos/providenciales/leeward/tranquility--126870",
    name: "Tranquility",
    location: "Leeward / Grace Bay area, Providenciales, Turks and Caicos",
    galleryPrefix: "tranquility",
    galleryCount: 21,
    rateDisplay: "~$21,500",
    rateType: "APPROXIMATE",
    size: "11 ha land",
    beds: "11",
    baths: "13+",
    guests: "22",
    seasonality:
      "High Caribbean season busier. 8-bedroom main house + 3-bedroom guest house, resort-style pool, tennis/pickleball, gym, sauna, spa, private dock, 9 staff.",
    estimatedValueText: "$35–45M; $28–54M",
    confidence: "MEDIUM",
    fixtureShares: 1400,
    fixtureSharePriceUsd: 9000,
    fixtureStatus: "resale",
    valuationUsd: 3_500_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $35-45M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-mexico-city-penthouse",
    listingId: "130397",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/turks-and-caicos/providenciales/long-bay/pearls-of-long-bay-estate-130397",
    name: "Pearls of Long Bay Estate",
    location: "Long Bay, Providenciales, Turks and Caicos",
    galleryPrefix: "pearls-of-long-bay-estate",
    galleryCount: 95,
    rateDisplay: "~$28,100",
    rateType: "APPROXIMATE",
    size: "each villa ~12,000 ft²; beach 450 ft",
    beds: "28",
    baths: "28+",
    guests: "56",
    seasonality:
      "High season busier. Three large beachfront villas, championship tennis, gym, Turkish sauna, steam room, massage pavilion.",
    estimatedValueText: "$60–80M; $48–96M",
    confidence: "MEDIUM",
    fixtureShares: 900,
    fixtureSharePriceUsd: 12500,
    fixtureStatus: "resale",
    valuationUsd: 6_000_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $60-80M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-kyoto-machiya",
    listingId: "127483",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/turks-and-caicos/ambergris-cay/dream-pavilion-127483",
    name: "Dream Pavilion",
    location: "Ambergris Cay, Turks and Caicos",
    galleryPrefix: "dream-pavilion",
    galleryCount: 30,
    rateDisplay: "~$18,029",
    rateType: "APPROXIMATE",
    size: null,
    beds: "6",
    baths: "6",
    guests: "14",
    seasonality:
      "High season busier. Private-island villa with two pools, private garden/beach, dedicated chef/butler, private air transfer, non-motorized water activities.",
    estimatedValueText: "$20–28M; $16–33.6M",
    confidence: "MEDIUM",
    fixtureShares: 600,
    fixtureSharePriceUsd: 11000,
    fixtureStatus: "funded",
    valuationUsd: 2_000_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $20-28M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-cape-town-villa",
    listingId: "108856",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-asia/thailand/koh-yaonoi/phang-ngabay/ani-thailand-108856",
    name: "ANI Thailand",
    location: "Koh Yao Noi, Phang Nga Bay, Thailand",
    galleryPrefix: "ani-thailand",
    galleryCount: 27,
    rateDisplay: "~$22,000",
    rateType: "APPROXIMATE",
    size: "land ~2 ha",
    beds: "10",
    baths: "10",
    guests: "20",
    seasonality:
      "Nov–Apr busier. Private resort, Lanna-inspired architecture, pools, private beach, spa, gym, 20+ staff, all-inclusive.",
    estimatedValueText: "$45–60M; $36–72M",
    confidence: "MEDIUM",
    fixtureShares: 1200,
    fixtureSharePriceUsd: 10000,
    fixtureStatus: "resale",
    valuationUsd: 4_500_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $45-60M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-bangkok-sukhumvit-condo",
    listingId: "108860",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-asia/sri-lanka/maliyadda/ani-sri-lanka-108860",
    name: "ANI Sri Lanka",
    location: "Maliyadda, South Coast, Sri Lanka",
    galleryPrefix: "ani-sri-lanka",
    galleryCount: 37,
    rateDisplay: "~$27,000",
    rateType: "APPROXIMATE",
    size: "garden ~5 ha",
    beds: "15",
    baths: "15",
    guests: "30",
    seasonality:
      "Dry season on south coast busier. Private coastal resort, two main villas, infinity pools, beach access, spa and full staff.",
    estimatedValueText: "$50–65M; $40–78M",
    confidence: "MEDIUM",
    fixtureShares: 1500,
    fixtureSharePriceUsd: 8500,
    fixtureStatus: "resale",
    valuationUsd: 5_000_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $50-65M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-amsterdam-canal-house",
    listingId: "106441",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/jamaica/ocho-rios/rio-chico-private-estate-106441",
    name: "Rio Chico Private Estate",
    location: "Ocho Rios, Jamaica",
    galleryPrefix: "rio-chico-private-estate",
    galleryCount: 63,
    rateDisplay: "~$23,179",
    rateType: "APPROXIMATE",
    size: "land 14 ha",
    beds: "12",
    baths: "12",
    guests: "24",
    seasonality:
      "Caribbean winter season busier. Clifftop estate, multiple pools including hidden ocean pool and Dunn's River natural pool, tropical gardens, tennis, full staff.",
    estimatedValueText: "$25–35M; $20–42M",
    confidence: "MEDIUM",
    fixtureShares: 600,
    fixtureSharePriceUsd: 14500,
    fixtureStatus: "resale",
    valuationUsd: 2_500_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $25-35M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-buenos-aires-recoleta-flat",
    listingId: "129549",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-vacation-rentals-usa/california/los-angeles-california/holmby-hills/forza-modern-129549",
    name: "Forza Modern",
    location: "Holmby Hills, Los Angeles, California, USA",
    galleryPrefix: "forza-modern",
    galleryCount: 53,
    rateDisplay: "from ~$12,000",
    rateType: "STARTING_FROM",
    size: "3 large levels; exact area UNKNOWN",
    beds: "6",
    baths: "10.5",
    guests: "12",
    seasonality:
      "Demand described as high year-round in Los Angeles. Modern architectural home, professional kitchen, theatre, gym/spa, pool, elevator, valley/mountain views.",
    estimatedValueText: "$18–28M; $14.4–33.6M",
    confidence: "MEDIUM",
    fixtureShares: 1300,
    fixtureSharePriceUsd: 9000,
    fixtureStatus: "resale",
    valuationUsd: 1_800_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $18-28M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-seoul-gangnam-studio",
    listingId: "123919",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-vacation-rentals-europe/france/southwest-france/bordeaux/chateau-prestige-123919",
    name: "Chateau Prestige",
    location: "Near Saint-Émilion, Bordeaux, Southwest France",
    galleryPrefix: "chateau-prestige",
    galleryCount: 35,
    rateDisplay: "~€11,815",
    rateType: "APPROXIMATE",
    size: "37 ha vineyard",
    beds: "11",
    baths: "11",
    guests: "24",
    seasonality:
      "Harvest season and summer busier. 15th-century château, two heated pools, gardens, private helipad, French billiards, library, full staff.",
    estimatedValueText: "$15–22M; $12–26.4M",
    confidence: "MEDIUM",
    fixtureShares: 1000,
    fixtureSharePriceUsd: 11500,
    fixtureStatus: "resale",
    valuationUsd: 1_500_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $15-22M band low ESTIMATED/MODELED (range preserved in research context)",
  },
  {
    propertyId: "prop-nyc-chelsea-loft",
    listingId: "122113",
    sourceUrl:
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/turks-and-caicos/providenciales/grace-bay/hawksbill-122113",
    name: "Hawksbill",
    location: "Grace Bay, Providenciales, Turks and Caicos",
    galleryPrefix: "hawksbill",
    galleryCount: 30,
    rateDisplay: "~$16,500",
    rateType: "APPROXIMATE",
    size: "land 4 ha",
    beds: "8",
    baths: "8",
    guests: "18",
    seasonality:
      "Dec–Apr busier. Large beachfront estate, two pools, tennis, gym, private dock, full staff.",
    estimatedValueText: "$22–30M; $17.6–36M",
    confidence: "MEDIUM",
    fixtureShares: 800,
    fixtureSharePriceUsd: 15000,
    fixtureStatus: "resale",
    valuationUsd: 2_200_000_000,
    valuationSource:
      "pm-decision-2026-09-09 lowest-valid-value rule: research $22-30M band low ESTIMATED/MODELED (range preserved in research context)",
  },
];

/** A. Canonical registry — exactly 24 marketplace estates. */
export const CANONICAL_MARKETPLACE_ESTATES: readonly CanonicalMarketplaceEstate[] = ROWS.map(buildRow);

/** B. Machine-readable reconciliation: propertyId → Rental Escapes Listing ID → estate. */
export const CANONICAL_RECONCILIATION: readonly CanonicalReconciliationRow[] = CANONICAL_MARKETPLACE_ESTATES.map(
  (e) => ({
    propertyId: e.propertyId,
    rentalEscapesListingId: e.rentalEscapesListingId,
    rentalEscapesSourceUrl: e.rentalEscapesSourceUrl,
    status: e.reconciliationStatus,
  }),
);

/** Lookup helper: canonical estate by stable runtime propertyId. */
export function getCanonicalEstate(propertyId: string): CanonicalMarketplaceEstate | undefined {
  return CANONICAL_MARKETPLACE_ESTATES.find((e) => e.propertyId === propertyId);
}

/** Lookup helper: canonical estate by Rental Escapes Listing ID. */
export function getCanonicalEstateByListingId(listingId: string): CanonicalMarketplaceEstate | undefined {
  return CANONICAL_MARKETPLACE_ESTATES.find((e) => e.rentalEscapesListingId === listingId);
}

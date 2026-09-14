// File responsibility: D7 locked location/transfer layer (Estate Page Structure
// §8, PO decision 2026-09-13) — the 24-villa location hierarchy and airport
// transfer facts, verbatim from the locked research report. Location hierarchy
// is CONFIRMED from Rental Escapes URL slugs + villa-page fetch (#1); transfer
// times are CONFIRMED where cited, else APPROX (verify at booking). No map
// asset exists yet — this module is text-only. ADDITIVE data module only.
import type { EstateLocationDetail, EstateTransferStatus } from "@/types/estate-page-data";
import { getEstate24ByRuntimeId } from "./estate-24-data";

function transfer(text: string, status: EstateTransferStatus) {
  return { text, status, isEstimate: status === "APPROX" };
}

/** The 24 locked location details, keyed by Estate24 record id (1–24). */
export const ESTATE_LOCATION_DETAILS: readonly EstateLocationDetail[] = [
  {
    estateId: 1,
    locationText: "JOALI Being, Bodufushi Island, Raa Atoll, Maldives",
    islandOrResort: "JOALI Being (68 villas, wellbeing island)",
    region: "Raa Atoll",
    transfer: transfer(
      "40-min shared/private seaplane MLE→Bodufushi, daylight only; alt domestic MLE→Ifuru 35min + boat 15min. Lounge at Velana. Source: joali.com + villa page rate incl. private seaplane RT (max 8).",
      "CONFIRMED",
    ),
  },
  {
    estateId: 2,
    locationText: "Buck Island, British Virgin Islands (private island)",
    islandOrResort: "The Aerial, BVI",
    region: "BVI – off Tortola",
    transfer: transfer(
      "EIS (Beef Island/Tortola) + 10-min drive to Hodges Creek + <5-min boat; total ~15 min runway-to-room. Via STT + ferry 45–60min + taxi. Source: aerialbvi.com/getting-here.",
      "CONFIRMED",
    ),
  },
  {
    estateId: 3,
    locationText: "Sorrento, Amalfi Coast, Campania, Italy",
    islandOrResort: "Villa Syrene",
    region: "Naples Bay / Amalfi",
    transfer: transfer(
      "Naples Airport (NAP) ~60–75 min drive (50km); + private transfer.",
      "APPROX",
    ),
    highlight: "cliffs over Bay of Naples, Capri day-trip",
  },
  {
    estateId: 4,
    locationText: "Saint-Jean-Cap-Ferrat, French Riviera, France",
    islandOrResort: "Villa du Cap",
    region: "Côte d'Azur, between Nice/Villefranche",
    transfer: transfer("Nice Côte d'Azur (NCE) ~25–30 min drive (13km).", "APPROX"),
    highlight: "Grand-Hotel peninsula, Beaulieu/Mediterranean views",
  },
  {
    estateId: 5,
    locationText: "Silly Creek, Providenciales, Turks & Caicos",
    islandOrResort: "Emerald Cay (private cay, bridge-access)",
    region: "Caicos – Silly Creek/Chalk Sound",
    transfer: transfer(
      "PLS airport → ~20–30 min drive (Grace Bay 10–12km; Long Bay/Leeward +10min). Taxi ~$28/2pax Grace Bay, $43–45 Leeward/Long Bay. Source: visittci.com.",
      "CONFIRMED",
    ),
  },
  {
    estateId: 6,
    locationText: "Moskito Island, BVI",
    islandOrResort: "Virgin Limited Edition – Moskito Island (125ac, 10 estates)",
    region: "BVI – opposite Necker",
    transfer: transfer(
      "EIS + 2-min drive to dock + ~30-min speedboat; incl. in rate. Heli pad available. Source: virginlimitededition.com/getting-here.",
      "CONFIRMED",
    ),
  },
  {
    estateId: 7,
    locationText: "Kitzbühel, Tyrol, Austria",
    islandOrResort: "Chalet Montana",
    region: "Kitzbüheler Alpen",
    transfer: transfer(
      "Innsbruck (INN) ~80 min; Munich (MUC) ~2h; Salzburg ~60–75 min drive.",
      "APPROX",
    ),
    highlight: "Hahnenkamm ski, golf",
  },
  {
    estateId: 8,
    locationText: "Saint-Jean, St-Barthélemy",
    islandOrResort: "Villa BDM",
    region: "St Barts – St Jean bay",
    transfer: transfer(
      "SBH airport in St Jean – 2–3 min to St Jean village; Gustavia 8–12 min. Access via SXM + 10–15-min Winair/St Barth Commuter hop or 45–60-min ferry Marigot→Gustavia. Daylight-only SBH. Source: taxisbh.com, wimco.com.",
      "CONFIRMED",
    ),
  },
  {
    estateId: 9,
    locationText: "Caesars Palace, Las Vegas Strip, Nevada, USA",
    islandOrResort: "Caesars Palace – Trajan suite/villa",
    region: "Las Vegas",
    transfer: transfer("Harry Reid LAS ~10–15 min drive (Strip).", "APPROX"),
    note: "hotel suite product, not standalone villa — flag legally",
  },
  {
    estateId: 10,
    locationText: "Pedregal, Cabo San Lucas, Los Cabos, Mexico",
    islandOrResort: "Villa La Datcha, Pedregal",
    region: "Baja Sur",
    transfer: transfer("Los Cabos SJD ~45 min drive.", "APPROX"),
    highlight: "Pedregal cliff, marina/Pacific views",
  },
  {
    estateId: 11,
    locationText: "Lake Como, Lombardy, Italy",
    islandOrResort: "Villa Galeazzo",
    region: "Lake Como",
    transfer: transfer("Milan Malpensa MXP ~60–75 min; Lugano ~30 min.", "APPROX"),
    highlight: "lakefront, Bellagio/Como boat",
  },
  {
    estateId: 12,
    locationText: "Gustavia, St-Barthélemy",
    islandOrResort: "Villa Embrace",
    region: "St Barts – Gustavia",
    transfer: transfer("SBH→Gustavia 8–12 min (~3km). Same SXM hop/ferry as #8.", "CONFIRMED"),
    highlight: "harbour, shops, Shell/Gouverneur beaches",
  },
  {
    estateId: 13,
    locationText: "Cabrera, María Trinidad Sánchez, Dominican Republic",
    islandOrResort: "ANI Private Resort – DR (all-inclusive estate)",
    region: "North Coast – Cabrera",
    transfer: transfer(
      "Puerto Plata POP ~60–75 min; Santo Domingo SDQ ~2.5–3h; Samaná AZS ~60 min.",
      "APPROX",
    ),
    highlight: "private peninsula, Playa Breña",
  },
  {
    estateId: 14,
    locationText: "Ranchos Estates, Punta Mita, Nayarit, Mexico",
    islandOrResort: "Ranchos Estates, Punta Mita",
    region: "Riviera Nayarit",
    transfer: transfer("Puerto Vallarta PVR ~45–60 min drive.", "APPROX"),
    highlight: "gated peninsula, surf, golf (Jack Nicklaus)",
  },
  {
    estateId: 15,
    locationText: "Long Bay Beach, Providenciales",
    islandOrResort: "Long Bay villa zone",
    region: "Caicos – Long Bay (kite beach)",
    transfer: transfer("PLS→Long Bay/Shore Club ~25–35 min, taxi ~$45. See #5 source.", "CONFIRMED"),
  },
  {
    estateId: 16,
    locationText: "Leeward, Providenciales",
    islandOrResort: "Leeward / Blue Haven marina zone",
    region: "Caicos – Leeward (sunset coast)",
    transfer: transfer("PLS→Leeward/Blue Haven ~25–35 min, taxi ~$43.", "CONFIRMED"),
  },
  {
    estateId: 17,
    locationText: "Long Bay Beach, Providenciales",
    islandOrResort: "Long Bay Estate",
    region: "Caicos – Long Bay",
    transfer: transfer(
      "Same as La Dolce Vita (#15): PLS→Long Bay/Shore Club ~25–35 min, taxi ~$45.",
      "CONFIRMED",
    ),
    highlight: "shallow turquoise, kiteboarding mecca",
  },
  {
    estateId: 18,
    locationText: "Ambergris Cay (Big Ambergris), TCI",
    islandOrResort: "Ambergris Cay Private Island Resort",
    region: "SE Caicos – private island",
    transfer: transfer(
      "PLS + 25-min domestic air/charter to Ambergris Cay airstrip + 5-min transfer; or boat charter.",
      "APPROX",
    ),
    note: "Private island, no day access.",
  },
  {
    estateId: 19,
    locationText: "Koh Yao Noi, Phang Nga Bay, Thailand",
    islandOrResort: "ANI Private Resort – Thailand",
    region: "Phang Nga Bay, between Phuket/Krabi",
    transfer: transfer(
      "Phuket HKT + 20-min land to Bang Rong/Ao Po pier + 30–40-min speedboat to Yao Noi (Laem Sai/Manoh). Total ~1.5–2h door-to-door. Source: phuketferry + Anantara transit guide.",
      "CONFIRMED",
    ),
    highlight: "limestone karsts, Phi Phi day-trip",
  },
  {
    estateId: 20,
    locationText: "Maliyadda, South Coast, Sri Lanka",
    islandOrResort: "ANI Private Resort – Sri Lanka",
    region: "Galle/Matara hinterland",
    transfer: transfer(
      "Colombo CMB ~2.5–3.5h drive (150km) or + domestic to Koggala + 30-min drive.",
      "APPROX",
    ),
    highlight: "cinnamon island, whale-watching Mirissa",
  },
  {
    estateId: 21,
    locationText: "Ocho Rios, St Ann, Jamaica",
    islandOrResort: "Rio Chico Estate",
    region: "North Coast – Ocho Rios",
    transfer: transfer(
      "Montego Bay MBJ ~90–110 min; Kingston KIN ~90 min; Ian Fleming OCN ~20 min.",
      "APPROX",
    ),
    highlight: "Dunn's River, White River",
  },
  {
    estateId: 22,
    locationText: "Holmby Hills, Los Angeles, California, USA",
    islandOrResort: "Forza Modern (single-family estate)",
    region: "Westside LA – Holmby Hills/Bel-Air",
    transfer: transfer("LAX ~25–40 min drive.", "APPROX"),
    highlight: "Holmby Park, UCLA, Beverly Hills adjacency",
  },
  {
    estateId: 23,
    locationText: "Bordeaux, Nouvelle-Aquitaine, France",
    islandOrResort: "Chateau Prestige",
    region: "Bordeaux wine country",
    transfer: transfer(
      "Bordeaux BOD ~30–60 min depending on appellation (Médoc/St-Emilion).",
      "APPROX",
    ),
    highlight: "vineyard estate, chateau stay",
  },
  {
    estateId: 24,
    locationText: "Grace Bay Beach, Providenciales",
    islandOrResort: "Grace Bay villa zone",
    region: "Caicos – Grace Bay (world-best beach)",
    transfer: transfer("PLS→Grace Bay ~10–20 min (7mi/11km), taxi $28/2pax.", "CONFIRMED"),
    note: "Shortest of TCI set.",
  },
];

const DETAIL_BY_ESTATE_ID: ReadonlyMap<number, EstateLocationDetail> = new Map(
  ESTATE_LOCATION_DETAILS.map((d) => [d.estateId, d]),
);

/** Location detail for one villa, by Estate24 record id (1–24). */
export function getLocationDetailByEstate24Id(estateId: number): EstateLocationDetail | null {
  return DETAIL_BY_ESTATE_ID.get(estateId) ?? null;
}

/** Location detail for one villa, by runtime propertyId (re-<listingId>). */
export function getLocationDetailByPropertyId(propertyId: string): EstateLocationDetail | null {
  const record = getEstate24ByRuntimeId(propertyId);
  return record ? getLocationDetailByEstate24Id(record.id) : null;
}

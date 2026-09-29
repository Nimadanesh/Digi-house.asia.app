// File responsibility: researched per-villa season calendars (Season Research
// v1). Each villa carries its own demand pattern with traceable sources —
// never a universal calendar. Research detail lives in
// docs/PRIVATE-CLUB-SEASON-RESEARCH-V1.md. Seasons describe expected
// luxury-rental DEMAND, not weather, and never imply confirmed availability.
export type SeasonBand = "peak" | "high" | "shoulder" | "off_peak";

export type ResearchConfidence = "HIGH" | "MEDIUM" | "LOW";

export type ResearchStatus = "RESEARCHED" | "PARTIAL" | "UNKNOWN";

export interface SeasonPeriod {
  /** Inclusive start, "MM-DD". */
  start: string;
  /** Inclusive end, "MM-DD". May precede start for year-spanning periods. */
  end: string;
  season: SeasonBand;
  reason: string;
  confidence: ResearchConfidence;
  sources: string[];
}

export interface VillaSeasonCalendar {
  propertyId: string;
  propertyName: string;
  location: string;
  listingId: string;
  /** Contiguous, non-overlapping, full-year coverage. */
  periods: SeasonPeriod[];
  notes: string;
  researchStatus: ResearchStatus;
}

const REPO = "repo:canonical-24.ts seasonality note (Rental-Escapes-sourced listing note)";

function p(
  start: string,
  end: string,
  season: SeasonBand,
  reason: string,
  confidence: ResearchConfidence,
  sources: string[],
): SeasonPeriod {
  return { start, end, season, reason, confidence, sources };
}

/** The 24 canonical villa calendars. Single source of truth — no duplicates. */
export const VILLA_SEASON_CALENDARS: readonly VillaSeasonCalendar[] = [
  {
    propertyId: "re-128862",
    propertyName: "Grand 2 BDM Ocean Pool Villa (JOALI Being)",
    location: "Bodufushi, JOALI Being, Raa Atoll, Maldives",
    listingId: "128862",
    periods: [
      p("12-20", "01-07", "peak", "Festive peak: Christmas/New Year highest demand.", "HIGH", [REPO, "travel.usnews.com/Maldives/When_To_Visit", "travelandleisure.com best-time-to-visit-the-maldives"]),
      p("12-01", "12-19", "high", "Dry season shoulder into festive.", "HIGH", [REPO, "enchantingtravels.com Maldives best-time"]),
      p("01-08", "04-30", "high", "Dry season; includes Chinese New Year uplift (late Jan–Feb, moves yearly) and Easter.", "HIGH", [REPO, "clubmed.us best-time-to-visit-maldives"]),
      p("05-01", "05-31", "shoulder", "Transition into wet monsoon.", "MEDIUM", [REPO]),
      p("11-01", "11-30", "shoulder", "Transition out of wet monsoon.", "MEDIUM", [REPO, "experiencetravelgroup.com Maldives seasonal guide"]),
      p("06-01", "10-31", "off_peak", "Wet southwest monsoon; lowest demand, best Club window.", "HIGH", [REPO, "travelandleisure.com best-time-to-visit-the-maldives"]),
    ],
    notes: "Dry Nov–Apr vs wet May–Oct is one of the best-evidenced patterns in the set. CNY uplift kept inside HIGH, not a separate PEAK.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-126855",
    propertyName: "The Aerial",
    location: "Buck Island, British Virgin Islands",
    listingId: "126855",
    periods: [
      p("12-20", "01-07", "peak", "Festive peak.", "HIGH", [REPO, "onefinestay.com Caribbean festive"]),
      p("12-01", "12-19", "high", "Early dry season.", "HIGH", [REPO]),
      p("01-08", "04-30", "high", "Dry high season incl. Easter window.", "HIGH", [REPO, "thetopvillas.com best-time-to-visit-the-caribbean"]),
      p("05-01", "05-31", "shoulder", "Shoulder into hurricane season.", "MEDIUM", [REPO, "hauteretreats.com Caribbean villa rentals shoulder guide"]),
      p("11-01", "11-30", "shoulder", "Late hurricane season tail.", "MEDIUM", [REPO]),
      p("06-01", "10-31", "off_peak", "Hurricane season (peak activity Aug–Oct); lowest demand.", "HIGH", [REPO, "rentalescapes.com Caribbean hurricane-season note", "bethgraham.com best Caribbean islands during hurricane season"]),
    ],
    notes: "Repo note (Nov–Apr high; summer/early fall lower) fully corroborated.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-108924",
    propertyName: "Syrene (Villa Syrene)",
    location: "Sorrento, Amalfi Coast, Italy",
    listingId: "108924",
    periods: [
      p("07-01", "08-31", "peak", "Peak summer: highest prices, lowest availability (Ferragosto mid-Aug).", "HIGH", [REPO, "excellenceluxuryvillas.com Lake Como/Italy peak-summer pricing", "villavacations.com Amalfi rental tips"]),
      p("05-15", "06-30", "high", "Early summer build-up.", "HIGH", [REPO, "lecollectionist.com Lake Como/Amalfi season guidance"]),
      p("09-01", "09-30", "high", "September remains busy.", "MEDIUM", ["lecollectionist.com Amalfi/Como September guidance"]),
      p("04-01", "05-14", "shoulder", "Spring opening; Easter uplift noted.", "MEDIUM", [REPO]),
      p("10-01", "10-31", "shoulder", "Autumn wind-down.", "MEDIUM", [REPO]),
      p("11-01", "03-31", "off_peak", "Coastal winter quiet.", "HIGH", [REPO]),
    ],
    notes: "Repo: summer + Italian holidays busy; fall/winter quieter.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-123861",
    propertyName: "Villa du Cap",
    location: "Saint-Jean-Cap-Ferrat, French Riviera, France",
    listingId: "123861",
    periods: [
      p("07-01", "08-31", "peak", "Peak Riviera summer.", "HIGH", [REPO, "lecollectionist.com Riviera/Amalfi season guidance"]),
      p("05-01", "06-30", "high", "Cannes Film Festival (mid-May) + Monaco GP (late May) + early summer.", "MEDIUM", [REPO, "recurring annual event calendars (dates vary by year)"]),
      p("09-01", "09-30", "high", "September extension.", "MEDIUM", ["redsavannah.com Italian Lakes/Riviera September guidance"]),
      p("04-01", "04-30", "shoulder", "Spring opening.", "MEDIUM", [REPO]),
      p("10-01", "10-31", "shoulder", "Autumn wind-down.", "MEDIUM", [REPO]),
      p("11-01", "03-31", "off_peak", "Winter quiet.", "HIGH", [REPO]),
    ],
    notes: "Festival/GP uplift is real but event-date-dependent; kept at HIGH, not PEAK.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-125643",
    propertyName: "Emerald Cay",
    location: "Silly Creek, Providenciales, Turks and Caicos",
    listingId: "125643",
    periods: [
      p("12-20", "01-07", "peak", "Festive peak.", "HIGH", [REPO, "onefinestay.com Caribbean festive"]),
      p("12-01", "12-19", "high", "Early dry season.", "HIGH", [REPO]),
      p("01-08", "04-30", "high", "Dry high season incl. Easter.", "HIGH", [REPO]),
      p("05-01", "05-31", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("11-01", "11-30", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("06-01", "10-31", "off_peak", "Hurricane season; lowest demand.", "HIGH", [REPO, "rentalescapes.com Caribbean hurricane-season note"]),
    ],
    notes: "Repo Dec–Apr busier; summer quieter.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-130393",
    propertyName: "The Branson Beach Estate",
    location: "Moskito Island, British Virgin Islands",
    listingId: "130393",
    periods: [
      p("12-20", "01-07", "peak", "Festive peak.", "HIGH", [REPO, "onefinestay.com Caribbean festive"]),
      p("11-01", "12-19", "high", "Nov–Apr busy window per listing.", "HIGH", [REPO]),
      p("01-08", "04-30", "high", "Dry high season.", "HIGH", [REPO]),
      p("05-01", "05-31", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("06-01", "10-31", "off_peak", "Hurricane season.", "HIGH", [REPO, "bethgraham.com best Caribbean islands during hurricane season"]),
    ],
    notes: "Repo explicitly includes November in the busy window — no November shoulder here.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-130901",
    propertyName: "Chalet Montana",
    location: "Kitzbühel, Tyrol, Austria",
    listingId: "130901",
    periods: [
      p("12-20", "01-07", "peak", "Christmas/New Year peak.", "HIGH", [REPO, "powderhounds.com Austria when-to-go", "snowscape.co.uk Austria key dates 2026/27"]),
      p("02-07", "03-01", "peak", "European half-term / Week 8 peak.", "HIGH", ["snowscape.co.uk Austria key dates", "alpentravel.com Week 8 peak", "powderhounds.com mid-late February high season"]),
      p("12-01", "12-19", "high", "Early season.", "HIGH", [REPO, "austria.info winter openings"]),
      p("01-08", "02-06", "high", "Core ski season.", "HIGH", [REPO, "ski-austria.com month-by-month guide"]),
      p("03-02", "04-06", "high", "Late/spring skiing.", "MEDIUM", ["ski-austria.com spring skiing", "schlosshotel-kitzbuehel.com season guide"]),
      p("07-01", "08-31", "shoulder", "Summer alpine demand; chalet is ski-positioned so muted.", "MEDIUM", [REPO]),
      p("04-07", "06-30", "off_peak", "Inter-season closure window.", "MEDIUM", [REPO]),
      p("09-01", "11-30", "off_peak", "Autumn inter-season.", "MEDIUM", [REPO]),
    ],
    notes: "Only ski-driven calendar in the set; inverted vs tropical villas (good for pool diversification).",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-131293",
    propertyName: "Villa BDM",
    location: "Saint Jean Beach, St. Barthelemy",
    listingId: "131293",
    periods: [
      p("12-20", "01-07", "peak", "Festive peak.", "HIGH", [REPO, "onefinestay.com Caribbean festive"]),
      p("12-01", "12-19", "high", "Early dry season.", "HIGH", [REPO]),
      p("01-08", "04-30", "high", "Dry high season.", "HIGH", [REPO]),
      p("05-01", "05-31", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("11-01", "11-30", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("06-01", "10-31", "off_peak", "Hurricane season.", "HIGH", [REPO, "rentalescapes.com Caribbean hurricane-season note"]),
    ],
    notes: "Repo Dec–Apr busier.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-128529",
    propertyName: "Trajan Villa at Caesars Palace",
    location: "Caesars Palace, Las Vegas, Nevada, USA",
    listingId: "128529",
    periods: [
      p("12-24", "01-02", "peak", "New Year holiday peak.", "HIGH", [REPO, "civitatis.com best-time-to-visit-las-vegas (peaks for CES, Super Bowl, NYE)"]),
      p("11-15", "11-23", "peak", "F1 Grand Prix race week (mid-November; exact race dates vary by year; contracted through 2037; largest special-event impact on record).", "HIGH", ["reviewjournal.com F1 largest special-event economic impact", "formula1.com Las Vegas Grand Prix", "esim4.com Vegas F1 November busy", "facebook.com VegasStarfish F1 extension through 2037"]),
      p("01-03", "02-28", "high", "CES (early Jan) + Super Bowl (early Feb) uplift.", "HIGH", [REPO, "civitatis.com CES/Super Bowl peaks", "esim4.com CES Jan, Super Bowl events"]),
      p("03-01", "05-31", "high", "Spring convention season.", "MEDIUM", [REPO]),
      p("09-01", "11-14", "high", "Fall convention season.", "MEDIUM", [REPO]),
      p("11-24", "11-30", "high", "Thanksgiving week.", "MEDIUM", [REPO]),
      p("12-01", "12-23", "shoulder", "Pre-holiday.", "MEDIUM", [REPO]),
      p("06-01", "06-30", "shoulder", "Early summer heat build.", "MEDIUM", [REPO]),
      p("07-01", "08-31", "off_peak", "Extreme summer heat; weakest midweek demand.", "MEDIUM", [REPO]),
    ],
    notes: "Event-driven calendar: F1 week is an event rule (mid-November, dates vary yearly), not a fixed universal band. Convention/spring/fall demand per listing note.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-123320",
    propertyName: "La Datcha (Villa La Datcha)",
    location: "Pedregal, Cabo San Lucas, Los Cabos, Mexico",
    listingId: "123320",
    periods: [
      p("12-20", "01-07", "peak", "Holiday peak.", "HIGH", [REPO, "pacaso.com best time to visit Cabo (Dec–mid-Apr peak)"]),
      p("11-01", "12-19", "high", "Early high season.", "HIGH", [REPO, "pacaso.com Cabo peak season"]),
      p("01-08", "04-30", "high", "Peak season incl. spring break.", "HIGH", [REPO, "pacaso.com Cabo spring break crowds"]),
      p("05-01", "07-31", "shoulder", "Hot shoulder.", "MEDIUM", [REPO, "luxmex.com San Jose del Cabo month-by-month"]),
      p("08-01", "10-31", "off_peak", "Storm season; property noted closed Aug–Oct.", "HIGH", [REPO, "travel.usnews.com Cabo hurricane season", "luxmex.com August–September storm risk"]),
    ],
    notes: "CONFLICT recorded: one resort source claims peak season 'starts May–October' (garzablancaresort.com) vs Dec–Apr consensus + repo closure note — resolved toward consensus, marked in doc §11.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-109098",
    propertyName: "Galeazzo (Villa Galeazzo)",
    location: "Tremezzo, Lake Como, Lombardy, Italy",
    listingId: "109098",
    periods: [
      p("07-01", "08-31", "peak", "Peak summer: highest prices, lowest availability.", "HIGH", [REPO, "excellenceluxuryvillas.com Como peak summer", "myprivatevillas.com Como peak season booking lead"]),
      p("05-15", "06-30", "high", "Early summer.", "HIGH", [REPO, "lecollectionist.com Como season guidance"]),
      p("09-01", "09-30", "high", "September still busy.", "MEDIUM", ["lecollectionist.com Como September guidance", "redsavannah.com Italian lakes autumn"]),
      p("04-01", "05-14", "shoulder", "Spring opening.", "MEDIUM", [REPO, "redsavannah.com May/June + autumn recommendation"]),
      p("10-01", "10-31", "shoulder", "Autumn wind-down.", "MEDIUM", [REPO]),
      p("11-01", "03-31", "off_peak", "Winter closure-like quiet.", "HIGH", [REPO]),
    ],
    notes: "Repo: summer/early fall busier.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-127825",
    propertyName: "Embrace",
    location: "Gustavia Heights, St. Barthelemy",
    listingId: "127825",
    periods: [
      p("12-20", "01-07", "peak", "Festive peak.", "HIGH", [REPO, "onefinestay.com Caribbean festive"]),
      p("12-01", "12-19", "high", "Early dry season.", "HIGH", [REPO]),
      p("01-08", "04-30", "high", "Dry high season.", "HIGH", [REPO]),
      p("05-01", "05-31", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("11-01", "11-30", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("06-01", "10-31", "off_peak", "Hurricane season.", "HIGH", [REPO, "rentalescapes.com Caribbean hurricane-season note"]),
    ],
    notes: "Repo Dec–Apr busier.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-122422",
    propertyName: "ANI Dominican Republic",
    location: "Cabrera, North Coast, Dominican Republic",
    listingId: "122422",
    periods: [
      p("12-20", "01-07", "peak", "Festive peak.", "HIGH", [REPO, "onefinestay.com Caribbean festive"]),
      p("12-01", "12-19", "high", "Dry season onset.", "HIGH", [REPO]),
      p("01-08", "04-30", "high", "Dry Caribbean season.", "HIGH", [REPO]),
      p("05-01", "06-30", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("11-01", "11-30", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("07-01", "10-31", "off_peak", "Hurricane exposure on north coast.", "HIGH", [REPO, "bethgraham.com best Caribbean islands during hurricane season"]),
    ],
    notes: "Repo: dry Caribbean season busier.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-129548",
    propertyName: "Mita Principe",
    location: "Ranchos Estates, Punta Mita, Mexico",
    listingId: "129548",
    periods: [
      p("12-20", "01-07", "peak", "Holiday peak.", "HIGH", [REPO, "pacaso.com Cabo/Mexico winter peak pattern"]),
      p("11-01", "12-19", "high", "Nov–Apr busy window.", "HIGH", [REPO]),
      p("01-08", "04-30", "high", "Dry high season.", "HIGH", [REPO]),
      p("05-01", "06-30", "shoulder", "Hot shoulder.", "MEDIUM", [REPO]),
      p("07-01", "10-31", "off_peak", "Pacific storm season.", "HIGH", [REPO, "travel.usnews.com Pacific hurricane season May 15–Nov 30"]),
    ],
    notes: "Repo Nov–Apr busier → November HIGH here.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-122903",
    propertyName: "La Dolce Vita",
    location: "Long Bay, Providenciales, Turks and Caicos",
    listingId: "122903",
    periods: [
      p("12-20", "01-07", "peak", "Festive peak.", "HIGH", [REPO, "onefinestay.com Caribbean festive"]),
      p("12-01", "12-19", "high", "Early dry season.", "HIGH", [REPO]),
      p("01-08", "04-30", "high", "Dry high season.", "HIGH", [REPO]),
      p("05-01", "05-31", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("11-01", "11-30", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("06-01", "10-31", "off_peak", "Hurricane season.", "HIGH", [REPO, "rentalescapes.com Caribbean hurricane-season note"]),
    ],
    notes: "Repo Dec–Apr busier. Listing rate is DYNAMIC (exact dates required) — calendar research still valid.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-126870",
    propertyName: "Tranquility",
    location: "Leeward / Grace Bay area, Providenciales, Turks and Caicos",
    listingId: "126870",
    periods: [
      p("12-20", "01-07", "peak", "Festive peak.", "HIGH", [REPO, "onefinestay.com Caribbean festive"]),
      p("12-01", "12-19", "high", "High Caribbean season.", "HIGH", [REPO]),
      p("01-08", "04-30", "high", "High season.", "HIGH", [REPO]),
      p("05-01", "05-31", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("11-01", "11-30", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("06-01", "10-31", "off_peak", "Hurricane season.", "HIGH", [REPO, "bethgraham.com best Caribbean islands during hurricane season"]),
    ],
    notes: "Repo: high Caribbean season busier.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-130397",
    propertyName: "Pearls of Long Bay Estate",
    location: "Long Bay, Providenciales, Turks and Caicos",
    listingId: "130397",
    periods: [
      p("12-20", "01-07", "peak", "Festive peak.", "HIGH", [REPO, "onefinestay.com Caribbean festive"]),
      p("12-01", "12-19", "high", "High season.", "HIGH", [REPO]),
      p("01-08", "04-30", "high", "High season.", "HIGH", [REPO]),
      p("05-01", "05-31", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("11-01", "11-30", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("06-01", "10-31", "off_peak", "Hurricane season.", "HIGH", [REPO]),
    ],
    notes: "Repo: high season busier.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-127483",
    propertyName: "Dream Pavilion",
    location: "Ambergris Cay, Turks and Caicos",
    listingId: "127483",
    periods: [
      p("12-20", "01-07", "peak", "Festive peak.", "HIGH", [REPO, "onefinestay.com Caribbean festive"]),
      p("12-01", "12-19", "high", "High season.", "HIGH", [REPO]),
      p("01-08", "04-30", "high", "High season.", "HIGH", [REPO]),
      p("05-01", "05-31", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("11-01", "11-30", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("06-01", "10-31", "off_peak", "Hurricane season.", "HIGH", [REPO]),
    ],
    notes: "Repo: high season busier.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-108856",
    propertyName: "ANI Thailand",
    location: "Koh Yao Noi, Phang Nga Bay, Thailand",
    listingId: "108856",
    periods: [
      p("12-20", "01-07", "peak", "Festive peak in dry season.", "HIGH", [REPO, "travel.usnews.com Phuket when-to-visit"]),
      p("11-01", "12-19", "high", "Dry season onset.", "HIGH", [REPO, "phuket.net climate (dry from December)"]),
      p("01-08", "03-31", "high", "Dry/cool season incl. CNY uplift.", "HIGH", [REPO, "intrepidtravel.com Thailand cool winter Nov–Feb"]),
      p("04-01", "05-31", "shoulder", "Hot season transition.", "MEDIUM", [REPO, "intrepidtravel.com Thailand hot season"]),
      p("10-01", "10-31", "shoulder", "Monsoon tail.", "MEDIUM", [REPO]),
      p("06-01", "09-30", "off_peak", "Southwest monsoon; quietest months.", "HIGH", [REPO, "responsibletravel.com Thailand quietest Aug–Sep", "andamandaphuket.com wet season Jun–Oct"]),
    ],
    notes: "Repo Nov–Apr busier. CNY uplift kept inside HIGH.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-108860",
    propertyName: "ANI Sri Lanka",
    location: "Maliyadda, South Coast, Sri Lanka",
    listingId: "108860",
    periods: [
      p("12-20", "01-07", "peak", "Festive peak in dry season.", "HIGH", [REPO, "blog.wego.com Sri Lanka monsoon guide (Dec–Mar west/south peak)"]),
      p("12-01", "12-19", "high", "South-coast dry season.", "HIGH", [REPO, "srilankavisits.com south coast Dec–Mar"]),
      p("01-08", "03-31", "high", "Peak beach weather south/west.", "HIGH", [REPO, "oretatravels.com south/west Dec–Apr", "lankanstays.com south-coast season"]),
      p("04-01", "04-30", "shoulder", "Inter-monsoon transition.", "MEDIUM", [REPO, "visitsrilanka.asia two-monsoon guide"]),
      p("11-01", "11-30", "shoulder", "Monsoon transition.", "MEDIUM", [REPO]),
      p("05-01", "10-31", "off_peak", "Yala southwest monsoon on south coast.", "HIGH", [REPO, "srilanka-spirit.com monsoon-safe beaches guide"]),
    ],
    notes: "Two-monsoon island; south coast dry Dec–Apr is well corroborated.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-106441",
    propertyName: "Rio Chico Private Estate",
    location: "Ocho Rios, Jamaica",
    listingId: "106441",
    periods: [
      p("12-20", "01-07", "peak", "Festive peak.", "HIGH", [REPO, "onefinestay.com Caribbean festive"]),
      p("12-01", "12-19", "high", "Winter season onset.", "HIGH", [REPO]),
      p("01-08", "04-30", "high", "Caribbean winter season.", "HIGH", [REPO]),
      p("05-01", "06-30", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("11-01", "11-30", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("07-01", "10-31", "off_peak", "Hurricane season.", "HIGH", [REPO, "rentalescapes.com Caribbean hurricane-season note"]),
    ],
    notes: "Repo: Caribbean winter season busier.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-129549",
    propertyName: "Forza Modern",
    location: "Holmby Hills, Los Angeles, California, USA",
    listingId: "129549",
    periods: [
      p("06-15", "08-31", "peak", "Summer peak season; peak pricing and crowds.", "HIGH", [REPO, "wander.com summer is peak season in LA", "excellenceluxuryvillas.com peak pricing late June–August", "avantstay.com July most crowded"]),
      p("12-20", "01-07", "peak", "Christmas/New Year holiday peak.", "MEDIUM", [REPO, "thetopvillas.com Los Angeles best-time guide (holiday demand)"]),
      p("03-01", "06-14", "high", "Spring season; warm, busy but below summer peak.", "MEDIUM", [REPO, "hellotickets.com Mar–May recommendation", "thetopvillas.com Mar–May best time"]),
      p("01-08", "02-28", "shoulder", "Post-holiday winter; rainy season; closest thing to a low season, no true off-peak evidence.", "MEDIUM", [REPO]),
      p("09-01", "11-19", "shoulder", "Fall shoulder; warm with thinning crowds.", "MEDIUM", [REPO, "avantstay.com Sep–Oct shoulder", "hellotickets.com Sep recommendation"]),
      p("11-20", "11-30", "high", "Thanksgiving travel surge.", "MEDIUM", [REPO, "US Thanksgiving travel surge (annual recurring)"]),
      p("12-01", "12-19", "shoulder", "Pre-holiday December.", "MEDIUM", [REPO]),
    ],
    notes: "No off-peak band supportable from evidence — LA shows no true low season, so none is forced. Summer peak is HIGH-confidence; holiday bands MEDIUM.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-123919",
    propertyName: "Chateau Prestige",
    location: "Near Saint-Émilion, Bordeaux, Southwest France",
    listingId: "123919",
    periods: [
      p("07-01", "08-31", "peak", "Peak summer.", "HIGH", [REPO, "ophorus.com Burgundy/Bordeaux peak summer Jul–Aug"]),
      p("09-10", "10-25", "peak", "Vendanges/harvest season.", "HIGH", [REPO, "bordeauxwinetrails.com harvest season", "intothevineyard.com Bordeaux harvest timing", "atlasbordeaux.com Sep–Oct harvest"]),
      p("05-15", "06-30", "high", "Early summer.", "MEDIUM", [REPO]),
      p("09-01", "09-09", "high", "Harvest shoulder.", "MEDIUM", [REPO, "winetravelguides.com 2026 harvest season"]),
      p("04-01", "05-14", "shoulder", "Spring.", "MEDIUM", [REPO]),
      p("10-26", "11-15", "shoulder", "Post-harvest.", "MEDIUM", [REPO]),
      p("11-16", "03-31", "off_peak", "Winter quiet.", "HIGH", [REPO]),
    ],
    notes: "Dual-peak (summer + harvest) is the distinctive pattern here; harvest dates shift yearly — calendar must be confirmed per season.",
    researchStatus: "RESEARCHED",
  },
  {
    propertyId: "re-122113",
    propertyName: "Hawksbill",
    location: "Grace Bay, Providenciales, Turks and Caicos",
    listingId: "122113",
    periods: [
      p("12-20", "01-07", "peak", "Festive peak.", "HIGH", [REPO, "onefinestay.com Caribbean festive"]),
      p("12-01", "12-19", "high", "Dec–Apr busy window.", "HIGH", [REPO]),
      p("01-08", "04-30", "high", "Dry high season.", "HIGH", [REPO]),
      p("05-01", "05-31", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("11-01", "11-30", "shoulder", "Shoulder.", "MEDIUM", [REPO]),
      p("06-01", "10-31", "off_peak", "Hurricane season.", "HIGH", [REPO]),
    ],
    notes: "Repo Dec–Apr busier.",
    researchStatus: "RESEARCHED",
  },
];

/** Fast lookup by canonical runtime propertyId. Preserves existing helper signature. */
const BY_ID: Readonly<Record<string, VillaSeasonCalendar>> = Object.fromEntries(
  VILLA_SEASON_CALENDARS.map((c) => [c.propertyId, c]),
);

export function getVillaSeasonCalendar(villaId: string): VillaSeasonCalendar | null {
  return BY_ID[villaId] ?? null;
}

const DAY_OF_YEAR = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

/**
 * Feb 29 decision (documented, tested): the model uses a 365-day non-leap
 * calendar. "02-29" computes to the same day ordinal as "03-01", so leap-day
 * lookups resolve to whichever period contains March 1st. No separate leap
 * handling exists by design — availability systems own real calendar dates.
 */
function toDayOfYear(mmdd: string): number {
  const [m, d] = mmdd.split("-").map(Number);
  return DAY_OF_YEAR[(m ?? 1) - 1]! + (d ?? 1);
}

/** Days in [start, end] inclusive, supporting year-spanning periods. Non-leap year. */
export function periodDayCount(start: string, end: string): number {
  const s = toDayOfYear(start);
  const e = toDayOfYear(end);
  return e >= s ? e - s + 1 : 365 - s + 1 + e;
}

/** Season band for an MM-DD date within a calendar, or null when unmatched. */
export function seasonOnDate(periods: readonly SeasonPeriod[], mmdd: string): SeasonBand | null {
  const [m, d] = mmdd.split("-").map(Number);
  const day = DAY_OF_YEAR[(m ?? 1) - 1]! + (d ?? 1);
  for (const period of periods) {
    const s = toDayOfYear(period.start);
    const e = toDayOfYear(period.end);
    const inside = e >= s ? day >= s && day <= e : day >= s || day <= e;
    if (inside) return period.season;
  }
  return null;
}

/** Total calendar days per season band for one villa (DERIVED from researched periods). */
export function seasonDayCounts(periods: readonly SeasonPeriod[]): Record<SeasonBand, number> {
  const counts: Record<SeasonBand, number> = { peak: 0, high: 0, shoulder: 0, off_peak: 0 };
  for (const period of periods) {
    counts[period.season] += periodDayCount(period.start, period.end);
  }
  return counts;
}

/** Club-preferred seasons: OFF_PEAK always; low-demand SHOULDER only when opted in. */
export function isClubPreferred(season: SeasonBand, opts?: { includeShoulder?: boolean }): boolean {
  if (season === "off_peak") return true;
  if (season === "shoulder" && opts?.includeShoulder === true) return true;
  return false;
}

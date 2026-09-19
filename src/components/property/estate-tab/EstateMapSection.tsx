"use client";
// File responsibility: Estate tab map directly below the Location section —
// an interactive Leaflet satellite map (Esri World Imagery) with a single
// marker for every villa that carries a display anchor (all 24 canonical
// villas; anything else renders nothing). Display-only: the estate dataset
// carries NO coordinates (Estate24Location is country/region/place/full
// strings), so each anchor below is the exact GeoCoordinates published on
// that villa's official Rental Escapes page — never canonical data and never
// mixed with any economic figure. No access token required for these tiles.
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import "leaflet/dist/leaflet.css";
import { Block } from "@/components/common/Block";

/** Official-page display anchors as [lat, lng] — presentation only. */
const DISPLAY_ANCHORS: Record<string, [number, number]> = {
  // Grand 2 BDM Ocean Pool Villa (JOALI Being, Bodufushi, Raa Atoll,
  // Maldives) — GeoCoordinates from the official Rental Escapes listing.
  "re-128862": [5.5073977, 72.9686396],
  // The Aerial (Buck Island, British Virgin Islands).
  "re-126855": [18.4234336, -64.5584825],
  // Villa Syrene (Sorrento, Amalfi Coast, Italy).
  "re-108924": [40.6275934, 14.3681198],
  // Villa du Cap (Saint-Jean-Cap-Ferrat, French Riviera, France).
  "re-123861": [43.6763245, 7.3297653],
  // Emerald Cay (Silly Creek, Providenciales, Turks & Caicos).
  "re-125643": [21.7566129, -72.3083379],
  // The Branson Beach Estate (Moskito Island, British Virgin Islands).
  "re-130393": [18.5145404, -64.3902848],
  // Chalet Montana (Kitzbühel, Tyrol, Austria).
  "re-130901": [47.41863, 12.43727],
  // Villa BDM (Saint-Jean, St Barthélemy).
  "re-131293": [17.9025801, -62.8326075],
  // Trajan (Las Vegas, Nevada, USA).
  "re-128529": [36.1161685, -115.174499],
  // Villa La Datcha (Pedregal, Cabo, Los Cabos, Mexico).
  "re-123320": [22.8726959, -109.9251843],
  // Galeazzo (Lake Como, Lombardy, Italy).
  "re-109098": [45.9827049, 9.2144227],
  // Embrace (Gustavia, St Barthélemy).
  "re-127825": [17.8999537, -62.8499855],
  // ANI Dominican Republic (Cabrera, Dominican Republic).
  "re-122422": [19.6617646, -70.0693894],
  // Mita Principe (Ranchos Estates, Punta Mita, Mexico).
  "re-129548": [20.7679633, -105.4993873],
  // La Dolce Vita (Long Bay, Providenciales, Turks & Caicos).
  "re-122903": [21.7666646, -72.167123],
  // Tranquility (Leeward, Providenciales, Turks & Caicos).
  "re-126870": [21.8234403, -72.1552875],
  // Pearls of Long Bay Estate (Long Bay, Providenciales, Turks & Caicos).
  "re-130397": [21.7732124, -72.1631142],
  // Dream Pavilion (Ambergris Cay, Turks & Caicos).
  "re-127483": [21.2983075, -71.6352177],
  // ANI Thailand (Koh Yao Noi, Phang Nga Bay, Thailand).
  "re-108856": [8.1151804, 98.6237916],
  // ANI Sri Lanka (Maliyadda, Sri Lanka).
  "re-108860": [5.9575888, 80.6569679],
  // Rio Chico Private Estate (Ocho Rios, Jamaica).
  "re-106441": [18.4056822, -77.0967357],
  // Forza Modern (Holmby Hills, Los Angeles, California, USA).
  "re-129549": [34.087479, -118.435011],
  // Chateau Prestige (Bordeaux, Southwest France, France).
  "re-123919": [45.0359609, -0.25134],
  // Hawksbill (Grace Bay, Providenciales, Turks & Caicos).
  "re-122113": [21.8249852, -72.1559097],
};

export function EstateMapSection({ propertyId }: { propertyId: string }) {
  const t = useTranslations("property");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const anchor = DISPLAY_ANCHORS[propertyId] ?? null;
    if (anchor == null || typeof window === "undefined") return;
    let cancelled = false;
    let remove: (() => void) | null = null;
    (async () => {
      try {
        const L = await import("leaflet");
        if (cancelled || containerRef.current == null) return;
        const map = L.map(containerRef.current, {
          center: anchor,
          zoom: 14,
          maxZoom: 18,
          attributionControl: false,
        });
        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution:
              "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
          },
        ).addTo(map);
        const pin = L.divIcon({
          className: "",
          html: '<div class="size-4 rounded-full border-2 border-white bg-primary shadow-md"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker(anchor, { icon: pin }).addTo(map);
        remove = () => map.remove();
      } catch {
        // Map unavailable (no network, no WebGL) — the card keeps its shape
        // with an empty canvas; never a broken state.
      }
    })();
    return () => {
      cancelled = true;
      try {
        remove?.();
      } catch {
        // Removal is best-effort on unmount.
      }
    };
  }, [propertyId]);

  if (DISPLAY_ANCHORS[propertyId] == null) return null;
  return (
    <div className="min-w-0" data-testid="estate-map">
      <Block
        className="min-w-0 overflow-hidden p-0 shadow-sm ring-1 ring-border/50"
        data-testid="estate-map-card"
      >
        <div
          ref={containerRef}
          role="img"
          aria-label={t("estateLocationTitle")}
          className="relative z-0 h-52 w-full bg-surface-2"
          data-testid="estate-map-canvas"
        />
      </Block>
    </div>
  );
}

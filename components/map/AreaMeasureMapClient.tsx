"use client";

import { useEffect, useRef, useState } from "react";
import {
  CircleMarker,
  FeatureGroup,
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";

interface AreaMeasureMapClientProps {
  onAreaConfirm: (areaSqm: number) => void;
}

type FeatureGroupType = L.FeatureGroup<any>;
type MapMode = "imagery" | "street";

interface SearchSuggestion {
  placeId: number;
  displayName: string;
  lat: number;
  lon: number;
  boundingBox: [[number, number], [number, number]] | null;
  importance: number;
  category?: string;
  type?: string;
  houseNumber?: string;
  road?: string;
}

function MapViewportController({
  targetCenter,
  targetBounds,
}: {
  targetCenter: [number, number] | null;
  targetBounds: [[number, number], [number, number]] | null;
}) {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
      if (targetBounds) {
        map.fitBounds(targetBounds, {
          padding: [36, 36],
          maxZoom: 21,
        });
        window.setTimeout(() => {
          if (targetCenter) {
            map.flyTo(targetCenter, 21.5, {
              animate: true,
              duration: 0.6,
            });
          }
        }, 180);
      } else if (targetCenter) {
        map.flyTo(targetCenter, 21, {
          animate: true,
          duration: 0.8,
        });
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [map, targetCenter, targetBounds]);

  return null;
}

export function AreaMeasureMapClient({
  onAreaConfirm,
}: AreaMeasureMapClientProps) {
  const featureGroupRef = useRef<FeatureGroupType | null>(null);
  const [areaSqm, setAreaSqm] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<[number, number] | null>(
    null,
  );
  const [selectedBounds, setSelectedBounds] = useState<
    [[number, number], [number, number]] | null
  >(null);
  const [mapMode, setMapMode] = useState<MapMode>("imagery");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();

    async function fetchSuggestions() {
      try {
        setSearching(true);
        const normalizedQuery = debouncedQuery.toLowerCase().trim();
        const queryHasHouseNumber = /\b\d+[a-z]?\b/i.test(normalizedQuery);

        const params = new URLSearchParams({
          q: debouncedQuery,
          format: "jsonv2",
          limit: "8",
          addressdetails: "1",
          countrycodes: "au",
          dedupe: "1",
        });

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Search request failed.");
        }

        const data = (await response.json()) as Array<{
          place_id: number;
          display_name: string;
          lat: string;
          lon: string;
          importance?: number;
          class?: string;
          type?: string;
          boundingbox?: [string, string, string, string];
          address?: {
            house_number?: string;
            road?: string;
          };
        }>;

        const suggestionsWithScore = data
          .map((item) => {
            const boundingBox =
              item.boundingbox?.length === 4
                ? ([
                    [Number(item.boundingbox[0]), Number(item.boundingbox[2])],
                    [Number(item.boundingbox[1]), Number(item.boundingbox[3])],
                  ] as [[number, number], [number, number]])
                : null;

            return {
              placeId: item.place_id,
              displayName: item.display_name,
              lat: Number(item.lat),
              lon: Number(item.lon),
              boundingBox,
              importance: item.importance ?? 0,
              category: item.class,
              type: item.type,
              houseNumber: item.address?.house_number,
              road: item.address?.road,
            };
          })
          .filter(
            (item) =>
              Number.isFinite(item.lat) &&
              Number.isFinite(item.lon) &&
              Boolean(item.displayName),
          )
          .sort((a, b) => {
            const aText = a.displayName.toLowerCase();
            const bText = b.displayName.toLowerCase();

            const aHasHouseNumber =
              Boolean(a.houseNumber) || /\b\d+[a-z]?\b/i.test(aText);
            const bHasHouseNumber =
              Boolean(b.houseNumber) || /\b\d+[a-z]?\b/i.test(bText);

            const aStartsWithQuery = aText.startsWith(normalizedQuery);
            const bStartsWithQuery = bText.startsWith(normalizedQuery);

            const aPropertyType =
              a.type === "house" ||
              a.type === "residential" ||
              a.type === "building";
            const bPropertyType =
              b.type === "house" ||
              b.type === "residential" ||
              b.type === "building";

            const aRoadMatch = a.road
              ? normalizedQuery.includes(a.road.toLowerCase())
              : false;
            const bRoadMatch = b.road
              ? normalizedQuery.includes(b.road.toLowerCase())
              : false;

            if (queryHasHouseNumber && aHasHouseNumber !== bHasHouseNumber) {
              return aHasHouseNumber ? -1 : 1;
            }

            if (aStartsWithQuery !== bStartsWithQuery) {
              return aStartsWithQuery ? -1 : 1;
            }

            if (aPropertyType !== bPropertyType) {
              return aPropertyType ? -1 : 1;
            }

            if (aRoadMatch !== bRoadMatch) {
              return aRoadMatch ? -1 : 1;
            }

            return b.importance - a.importance;
          });

        setSuggestions(suggestionsWithScore.slice(0, 5));
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    }

    fetchSuggestions();

    return () => controller.abort();
  }, [debouncedQuery]);

  function recalcArea() {
    const fg = featureGroupRef.current;
    if (!fg) return;

    let total = 0;
    fg.eachLayer((layer: any) => {
      if (!layer.getLatLngs) return;
      const latlngs = layer.getLatLngs();
      const ring =
        Array.isArray(latlngs) && Array.isArray(latlngs[0])
          ? latlngs[0]
          : latlngs;
      if (ring && (L as any).GeometryUtil?.geodesicArea) {
        const area = (L as any).GeometryUtil.geodesicArea(ring);
        if (Number.isFinite(area) && area > 0) {
          total += area;
        }
      }
    });

    setAreaSqm(total > 0 ? Math.round(total) : 0);
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search property address"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/30"
            />
            {query.trim().length >= 3 && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[1000] overflow-hidden rounded-2xl border border-zinc-800 bg-black/95 shadow-[0_0_35px_rgba(0,0,0,0.85)]">
                {searching ? (
                  <p className="px-3 py-2 text-xs text-zinc-400">
                    Searching addresses...
                  </p>
                ) : suggestions.length > 0 ? (
                  suggestions.map((suggestion) => (
                    <button
                      key={suggestion.placeId}
                      type="button"
                      onClick={() => {
                        setQuery(suggestion.displayName);
                        setSuggestions([]);
                        setSelectedCenter([suggestion.lat, suggestion.lon]);
                        setSelectedBounds(suggestion.boundingBox);
                      }}
                      className="block w-full border-b border-zinc-900 px-3 py-2 text-left text-xs text-zinc-200 transition hover:bg-zinc-900/90"
                    >
                      {suggestion.displayName}
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-xs text-zinc-500">
                    No matching addresses found.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:w-[220px]">
            <button
              type="button"
              onClick={() => setMapMode("imagery")}
              className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                mapMode === "imagery"
                  ? "border-amber-400/80 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-zinc-950 shadow-[0_0_20px_rgba(250,204,21,0.5)]"
                  : "border-zinc-800 bg-zinc-900/80 text-zinc-300"
              }`}
            >
              Aerial
            </button>
            <button
              type="button"
              onClick={() => setMapMode("street")}
              className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                mapMode === "street"
                  ? "border-amber-400/80 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-zinc-950 shadow-[0_0_20px_rgba(250,204,21,0.5)]"
                  : "border-zinc-800 bg-zinc-900/80 text-zinc-300"
              }`}
            >
              Street
            </button>
          </div>
        </div>

        <p className="text-[11px] text-zinc-500">
          Search an address, zoom in close, then trace the driveway polygon.
        </p>
      </div>

      <MapContainer
        center={[-28.0, 153.4]}
        zoom={19.5}
        zoomControl={true}
        maxZoom={22}
        className="h-64 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black sm:h-80"
        whenReady={(e) => {
          window.setTimeout(() => {
            e.target.invalidateSize();
          }, 0);
        }}
      >
        <MapViewportController
          targetCenter={selectedCenter}
          targetBounds={selectedBounds}
        />
        {mapMode === "imagery" ? (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri"
            maxZoom={22}
            maxNativeZoom={19}
          />
        ) : (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
            maxZoom={22}
            maxNativeZoom={19}
          />
        )}
        <FeatureGroup
          ref={(ref) => {
            featureGroupRef.current = ref as unknown as FeatureGroupType | null;
          }}
        >
          <EditControl
            position="topleft"
            onCreated={(event) => {
              const layer = (event as { layer?: L.Layer }).layer;
              const fg = featureGroupRef.current;
              if (fg && layer) {
                fg.clearLayers();
                fg.addLayer(layer);
              }
              recalcArea();
            }}
            onEdited={recalcArea}
            onDeleted={() => {
              setAreaSqm(0);
            }}
            draw={{
              marker: false,
              circle: false,
              circlemarker: false,
              polyline: false,
              rectangle: false,
              polygon: {
                allowIntersection: false,
                showArea: true,
                shapeOptions: {
                  color: "#facc15",
                  weight: 2,
                  fillColor: "#facc15",
                  fillOpacity: 0.25,
                },
              },
            }}
            edit={{
              edit: true,
              remove: true,
            }}
          />
        </FeatureGroup>
        {selectedCenter && (
          <CircleMarker
            center={selectedCenter}
            radius={7}
            pathOptions={{
              color: "#facc15",
              fillColor: "#facc15",
              fillOpacity: 0.8,
              weight: 2,
            }}
          />
        )}
      </MapContainer>

      <div className="flex items-center justify-between gap-3 text-xs">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            Measured area
          </p>
          <p className="mt-1 text-sm font-semibold text-amber-100">
            {areaSqm > 0
              ? `${areaSqm.toLocaleString("en-AU")} m²`
              : "Draw a polygon around the driveway."}
          </p>
        </div>
        <button
          type="button"
          disabled={areaSqm <= 0}
          onClick={() => onAreaConfirm(areaSqm)}
          className="rounded-2xl border border-amber-400/80 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-3 py-2 text-xs font-semibold text-zinc-950 shadow-[0_0_25px_rgba(250,204,21,0.6)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Use this area
        </button>
      </div>
    </div>
  );
}

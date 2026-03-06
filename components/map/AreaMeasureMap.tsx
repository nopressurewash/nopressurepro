"use client";

import { useRef, useState } from "react";
import { MapContainer, TileLayer, FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";

interface AreaMeasureMapProps {
  onAreaConfirm: (areaSqm: number) => void;
}

type FeatureGroupType = L.FeatureGroup<any>;

export function AreaMeasureMap({ onAreaConfirm }: AreaMeasureMapProps) {
  const featureGroupRef = useRef<FeatureGroupType | null>(null);
  const [areaSqm, setAreaSqm] = useState(0);

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
      <MapContainer
        center={[-28.0, 153.4]}
        zoom={18}
        zoomControl={true}
        className="h-64 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black sm:h-80"
        whenReady={(e) => {
          // Ensure proper rendering inside the modal.
          setTimeout(() => {
            e.target.invalidateSize();
          }, 0);
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
          maxZoom={20}
        />
        <FeatureGroup
          ref={(ref) => {
            // react-leaflet v5 passes the Leaflet instance directly.
            featureGroupRef.current = ref as unknown as FeatureGroupType | null;
          }}
        >
          <EditControl
            position="topleft"
            onCreated={recalcArea}
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


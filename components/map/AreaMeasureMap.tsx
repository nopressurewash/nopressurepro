"use client";

import dynamic from "next/dynamic";

interface AreaMeasureMapProps {
  onAreaConfirm: (areaSqm: number) => void;
  mapHeightClassName?: string;
}

const AreaMeasureMapClient = dynamic(
  () =>
    import("./AreaMeasureMapClient").then((mod) => mod.AreaMeasureMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full flex-col gap-3">
        <div className="space-y-2">
          <div className="h-11 rounded-2xl border border-zinc-800 bg-zinc-900/70" />
          <p className="text-[11px] text-zinc-500">
            Loading driveway measurement tools...
          </p>
        </div>
        <div className="h-[45vh] w-full rounded-2xl border border-zinc-800 bg-zinc-950/80 sm:h-[58vh]" />
        <div className="flex items-center justify-between gap-3 text-xs">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Measured area
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-300">
              Loading map...
            </p>
          </div>
          <div className="h-10 w-28 rounded-2xl border border-zinc-800 bg-zinc-900/70" />
        </div>
      </div>
    ),
  },
);

export function AreaMeasureMap({
  onAreaConfirm,
  mapHeightClassName,
}: AreaMeasureMapProps) {
  return (
    <AreaMeasureMapClient
      onAreaConfirm={onAreaConfirm}
      mapHeightClassName={mapHeightClassName}
    />
  );
}


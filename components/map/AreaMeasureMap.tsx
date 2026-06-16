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
          <div className="surface-panel h-11 rounded-2xl" />
          <p className="text-[11px] text-[var(--text-muted)]">
            Loading driveway measurement tools...
          </p>
        </div>
        <div className="surface-panel h-[45vh] w-full rounded-2xl sm:h-[58vh]" />
        <div className="flex items-center justify-between gap-3 text-xs">
          <div>
            <p className="label-muted">
              Measured area
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-secondary)]">
              Loading map...
            </p>
          </div>
          <div className="surface-panel h-10 w-28 rounded-2xl" />
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


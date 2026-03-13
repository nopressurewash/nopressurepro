"use client";

import { useEffect, useRef, useState } from "react";

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
}

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState(50);
  const [beforeLoaded, setBeforeLoaded] = useState(false);
  const [afterLoaded, setAfterLoaded] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    setBeforeLoaded(false);
    setAfterLoaded(false);
    setImageError(null);
    setPosition(50);
  }, [beforeUrl, afterUrl]);

  function updatePosition(clientX: number) {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, next)));
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    updatePosition(event.clientX);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!(event.buttons & 1) && event.pointerType !== "touch") return;
    updatePosition(event.clientX);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setPosition((prev) => Math.max(0, prev - 2));
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setPosition((prev) => Math.min(100, prev + 2));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
        <span>Before</span>
        <span>After</span>
      </div>

      <div
        ref={containerRef}
        role="slider"
        tabIndex={0}
        aria-label="Before and after comparison slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        className="relative h-[42vh] min-h-[260px] overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-black outline-none sm:h-[52vh]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKeyDown}
      >
        {!imageError && (!beforeLoaded || !afterLoaded) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75">
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-100">
                Loading comparison images...
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Preparing the before and after view.
              </p>
            </div>
          </div>
        )}

        {imageError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 px-4 text-center">
            <div>
              <p className="text-sm font-medium text-zinc-100">
                Comparison image could not be displayed.
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                The gallery images are still available below if you need to view
                them individually.
              </p>
            </div>
          </div>
        )}

        <img
          src={afterUrl}
          alt="After comparison"
          loading="lazy"
          onLoad={() => setAfterLoaded(true)}
          onError={() => setImageError("after")}
          className="absolute inset-0 z-0 h-full w-full object-cover"
        />

        <div
          className="absolute inset-0 z-10 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <img
            src={beforeUrl}
            alt="Before comparison"
            loading="lazy"
            onLoad={() => setBeforeLoaded(true)}
            onError={() => setImageError("before")}
            className="h-full w-full object-cover"
          />
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 z-20"
          style={{ left: `calc(${position}% - 1px)` }}
        >
          <div className="h-full w-0.5 bg-gold-light shadow-[0_0_18px_rgba(200,150,44,0.6)]" />
        </div>

        <div
          className="pointer-events-none absolute top-1/2 z-30 -translate-y-1/2"
          style={{ left: `calc(${position}% - 22px)` }}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/80 bg-black/85 shadow-[0_0_24px_rgba(200,150,44,0.4)]">
            <div className="flex items-center gap-1 text-gold-light">
              <span className="block h-3.5 w-px bg-gold-light" />
              <span className="block h-3.5 w-px bg-gold-light" />
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-500">
        Drag left or right to compare the first before and after photos.
      </p>
    </div>
  );
}


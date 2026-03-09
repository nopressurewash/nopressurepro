"use client";

import { useObjectUrl } from "../../hooks/useObjectUrl";
import type { JobPhotoRecord } from "../../lib/types";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

interface BeforeAfterModalProps {
  open: boolean;
  beforePhoto: JobPhotoRecord | null;
  afterPhoto: JobPhotoRecord | null;
  onClose: () => void;
}

export function BeforeAfterModal({
  open,
  beforePhoto,
  afterPhoto,
  onClose,
}: BeforeAfterModalProps) {
  const beforeUrl = useObjectUrl(beforePhoto?.blob);
  const afterUrl = useObjectUrl(afterPhoto?.blob);

  if (!open || !beforePhoto || !afterPhoto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 px-3 pb-6 pt-16 sm:items-center sm:px-4">
      <div className="w-full max-w-4xl rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 p-4 shadow-[0_0_60px_rgba(0,0,0,0.9)] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Before / After
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-100">
              Visual comparison for the first before and after photos.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-100"
          >
            Close
          </button>
        </div>

        <div className="mt-4">
          {!beforeUrl || !afterUrl ? (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 px-4 py-10 text-center">
              <p className="text-sm font-medium text-zinc-100">
                Loading comparison images...
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Preparing the first before and after photos for comparison.
              </p>
            </div>
          ) : (
            <BeforeAfterSlider
              beforeUrl={beforeUrl}
              afterUrl={afterUrl}
            />
          )}
        </div>
      </div>
    </div>
  );
}


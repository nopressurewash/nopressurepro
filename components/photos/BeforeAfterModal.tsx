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
    <div className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/90 px-3 pb-6 pt-16 sm:items-center sm:px-4">
      <div className="animate-fade-in-up w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Before / After
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">
              Visual comparison for the first before and after photos.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-zinc-500 hover:text-zinc-100 active:scale-[0.97]"
          >
            Close
          </button>
        </div>

        <div className="mt-4">
          {!beforeUrl || !afterUrl ? (
            <div className="rounded-xl border border-zinc-800 bg-black/50 px-4 py-10 text-center">
              <p className="text-sm font-semibold text-zinc-200">
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

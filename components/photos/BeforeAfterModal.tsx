"use client";

import { useEffect, useMemo, useState } from "react";
import { useObjectUrl } from "../../hooks/useObjectUrl";
import type { JobPhotoCategory, JobPhotoRecord } from "../../lib/types";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

interface BeforeAfterModalProps {
  open: boolean;
  photos: JobPhotoRecord[];
  onClose: () => void;
}

function getCategoryLabel(category: JobPhotoCategory) {
  switch (category) {
    case "before":
      return "Before";
    case "after":
      return "After";
    case "other":
      return "Other";
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
  });
}

function getCompareOptionLabel(photo: JobPhotoRecord, index: number) {
  const category = getCategoryLabel(photo.category);
  const caption = photo.caption?.trim();
  if (caption) {
    return `${category} — ${caption}`;
  }
  return `${category} — ${formatDate(photo.createdAt)} — Photo ${index + 1}`;
}

export function BeforeAfterModal({
  open,
  photos,
  onClose,
}: BeforeAfterModalProps) {
  const [firstPhotoId, setFirstPhotoId] = useState("");
  const [secondPhotoId, setSecondPhotoId] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const firstPhoto = useMemo(
    () => photos.find((photo) => photo.id === firstPhotoId) ?? null,
    [firstPhotoId, photos],
  );
  const secondPhoto = useMemo(
    () => photos.find((photo) => photo.id === secondPhotoId) ?? null,
    [photos, secondPhotoId],
  );

  const hasEnoughPhotos = photos.length >= 2;
  const selectedSamePhoto =
    Boolean(firstPhotoId) && Boolean(secondPhotoId) && firstPhotoId === secondPhotoId;
  const canOpenCompare =
    hasEnoughPhotos &&
    Boolean(firstPhoto) &&
    Boolean(secondPhoto) &&
    !selectedSamePhoto;

  const beforeUrl = useObjectUrl(firstPhoto?.blob);
  const afterUrl = useObjectUrl(secondPhoto?.blob);

  useEffect(() => {
    if (!open) return;
    setFirstPhotoId("");
    setSecondPhotoId("");
    setIsComparing(false);
    setBanner(null);
  }, [open]);

  function handleOpenCompare() {
    if (!hasEnoughPhotos) {
      setBanner("Add at least 2 photos before using compare.");
      return;
    }
    if (!firstPhotoId || !secondPhotoId) {
      setBanner("Select two photos to compare.");
      return;
    }
    if (selectedSamePhoto) {
      setBanner("Choose two different photos for comparison.");
      return;
    }
    setBanner(null);
    setIsComparing(true);
  }

  if (!open) return null;

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/90 px-3 pb-6 pt-16 sm:items-center sm:px-4">
      <div className="animate-fade-in-up w-full max-w-4xl rounded-2xl border border-[var(--brand-border)] bg-surface-raised p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Before / After
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">
              Choose the exact two photos to compare.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isComparing && (
              <button
                type="button"
                onClick={() => setIsComparing(false)}
                className="rounded-xl border border-[var(--brand-border)] bg-surface px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-zinc-600 hover:text-zinc-200 active:scale-[0.97]"
              >
                Change Photos
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-700/60 bg-surface px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-zinc-500 hover:text-zinc-100 active:scale-[0.97]"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-4">
          {!isComparing ? (
            <div className="space-y-3 rounded-xl border border-[var(--brand-border)] bg-surface p-3 sm:p-4">
              {hasEnoughPhotos ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                        First Image
                      </label>
                      <select
                        value={firstPhotoId}
                        onChange={(event) => {
                          setFirstPhotoId(event.target.value);
                          setBanner(null);
                        }}
                        className="w-full rounded-xl border border-[var(--brand-border)] bg-surface-raised px-3 py-2.5 text-sm text-zinc-100 outline-none transition-all duration-200 focus:border-gold/40 focus:ring-1 focus:ring-gold/15"
                      >
                        <option value="">Select photo</option>
                        {photos.map((photo, index) => (
                          <option key={photo.id} value={photo.id}>
                            {getCompareOptionLabel(photo, index)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                        Second Image
                      </label>
                      <select
                        value={secondPhotoId}
                        onChange={(event) => {
                          setSecondPhotoId(event.target.value);
                          setBanner(null);
                        }}
                        className="w-full rounded-xl border border-[var(--brand-border)] bg-surface-raised px-3 py-2.5 text-sm text-zinc-100 outline-none transition-all duration-200 focus:border-gold/40 focus:ring-1 focus:ring-gold/15"
                      >
                        <option value="">Select photo</option>
                        {photos.map((photo, index) => (
                          <option key={photo.id} value={photo.id}>
                            {getCompareOptionLabel(photo, index)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {selectedSamePhoto && (
                    <p className="text-xs font-medium text-amber-300">
                      Choose two different photos to compare.
                    </p>
                  )}
                  {banner && (
                    <p className="text-xs font-medium text-amber-300">{banner}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenCompare}
                    disabled={!canOpenCompare}
                    className="w-full rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-xs font-bold text-gold transition-all duration-200 hover:bg-gold/15 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Open Compare
                  </button>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-800/70 px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-zinc-200">
                    Not enough photos to compare.
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Add at least two photos for this job, then try compare again.
                  </p>
                </div>
              )}
            </div>
          ) : !beforeUrl || !afterUrl ? (
            <div className="rounded-xl border border-[var(--brand-border)] bg-surface px-4 py-10 text-center">
              <p className="text-sm font-semibold text-zinc-200">
                Loading comparison images...
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Preparing the selected photos for comparison.
              </p>
            </div>
          ) : (
            <BeforeAfterSlider beforeUrl={beforeUrl} afterUrl={afterUrl} />
          )}
        </div>
      </div>
    </div>
  );
}

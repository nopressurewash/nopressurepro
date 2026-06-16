"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useJobPhotos } from "../../hooks/useJobPhotos";
import { useObjectUrl } from "../../hooks/useObjectUrl";
import type { JobPhotoCategory, JobPhotoRecord } from "../../lib/types";
import { BeforeAfterModal } from "./BeforeAfterModal";
import { GhostCaptureModal } from "./GhostCaptureModal";
import { PhotoPreviewModal } from "./PhotoPreviewModal";
import { PhotoUploadButton } from "./PhotoUploadButton";

interface JobPhotoGalleryProps {
  quoteId: string;
  onPhotoCountChange?: (count: number) => void;
}

const categories: JobPhotoCategory[] = ["before", "after", "other"];

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

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
  });
}

function getPhotoSelectLabel(photo: JobPhotoRecord, index: number) {
  const category = getCategoryLabel(photo.category);
  const caption = photo.caption?.trim();
  if (caption) return `${category} - ${caption}`;
  return `${category} - ${formatDateTime(photo.createdAt)} - Photo ${index + 1}`;
}

function getPhotoContextLabel(photo: JobPhotoRecord) {
  const category = getCategoryLabel(photo.category);
  const caption = photo.caption?.trim();
  if (caption) return `${category} — ${caption}`;
  return `${category} — ${formatDateTime(photo.createdAt)}`;
}

function getAddPhotoHint(
  category: JobPhotoCategory,
  hasBeforePhotos: boolean,
) {
  switch (category) {
    case "before":
      return "Document the site before work starts.";
    case "after":
      return hasBeforePhotos
        ? "Capture finished results, or use ghost overlay for aligned shots."
        : "Add at least one Before photo first, then return here.";
    case "other":
      return "Optional extras — access, stains, equipment, or notes.";
  }
}

function getEmptyStateCopy(
  category: JobPhotoCategory,
  hasBeforePhotos: boolean,
) {
  switch (category) {
    case "before":
      return {
        title: "No before photos yet",
        body: "Start here on site. Use Take Photo or Choose Photo above.",
      };
    case "after":
      if (!hasBeforePhotos) {
        return {
          title: "No after photos yet",
          body: "Open the Before tab and add a reference shot first. That unlocks after photos and ghost capture.",
        };
      }
      return {
        title: "No after photos yet",
        body: "Add finished shots above. For matching angles, tap Use Before as Ghost to overlay a before reference while you shoot.",
      };
    case "other":
      return {
        title: "No other photos yet",
        body: "Add anything useful that is not a before/after pair.",
      };
  }
}

function PhotoTile({
  photo,
  pairBadge,
  onClick,
}: {
  photo: JobPhotoRecord;
  pairBadge?: string;
  onClick: () => void;
}) {
  const imageUrl = useObjectUrl(photo.blob);

  if (!imageUrl) {
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--brand-border)] bg-surface-raised">
        <div className="aspect-square w-full animate-pulse bg-surface" />
        <div className="px-2.5 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
            {getCategoryLabel(photo.category)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-xl border border-[var(--brand-border)] bg-surface-raised text-left transition-all duration-200 hover:border-zinc-700 active:scale-[0.98]"
    >
      <img
        src={imageUrl}
        alt={`${photo.category} job photo`}
        className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
      <div className="px-2.5 py-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          {getCategoryLabel(photo.category)}
        </p>
        <p className="mt-0.5 text-[11px] tabular-nums text-zinc-400">
          {formatDateTime(photo.createdAt)}
        </p>
        {photo.caption && (
          <p className="mt-0.5 truncate text-[11px] text-zinc-600">
            {photo.caption}
          </p>
        )}
        {pairBadge && (
          <p className="mt-1 inline-flex rounded-full border border-brand-purple/30 bg-brand-purple/10 px-2 py-0.5 text-[10px] font-semibold text-brand-purple-light">
            {pairBadge}
          </p>
        )}
      </div>
    </button>
  );
}

export function JobPhotoGallery({
  quoteId,
  onPhotoCountChange,
}: JobPhotoGalleryProps) {
  const {
    photos,
    loading,
    uploading,
    error,
    addPhotos,
    deletePhoto,
    movePhoto,
    updateCaption,
  } = useJobPhotos(quoteId);
  const [activeCategory, setActiveCategory] =
    useState<JobPhotoCategory>("before");
  const [previewPhoto, setPreviewPhoto] = useState<JobPhotoRecord | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showGhostPicker, setShowGhostPicker] = useState(false);
  const [showGhostCapture, setShowGhostCapture] = useState(false);
  const [ghostReferencePhotoId, setGhostReferencePhotoId] = useState("");
  const [compareInitialFirstId, setCompareInitialFirstId] = useState("");
  const [compareInitialSecondId, setCompareInitialSecondId] = useState("");
  const [compareAutoStart, setCompareAutoStart] = useState(false);
  const latestCountCallbackRef = useRef(onPhotoCountChange);
  const lastReportedCountRef = useRef<number | null>(null);

  const photosByCategory = useMemo(() => {
    return {
      before: photos.filter((photo) => photo.category === "before"),
      after: photos.filter((photo) => photo.category === "after"),
      other: photos.filter((photo) => photo.category === "other"),
    };
  }, [photos]);

  const activePhotos = photosByCategory[activeCategory];
  const totalPhotoCount = photos.length;
  const canCompare = totalPhotoCount >= 2;
  const beforePhotos = photosByCategory.before;
  const photoById = useMemo(
    () => new Map(photos.map((photo) => [photo.id, photo])),
    [photos],
  );
  const pairedAfterCountByBeforeId = useMemo(() => {
    return photos.reduce<Record<string, number>>((acc, photo) => {
      if (photo.category !== "after" || !photo.pairedBeforePhotoId) return acc;
      if (!photoById.has(photo.pairedBeforePhotoId)) return acc;
      acc[photo.pairedBeforePhotoId] = (acc[photo.pairedBeforePhotoId] ?? 0) + 1;
      return acc;
    }, {});
  }, [photoById, photos]);
  const selectedGhostPhoto =
    beforePhotos.find((photo) => photo.id === ghostReferencePhotoId) ?? null;
  const hasBeforePhotos = beforePhotos.length > 0;
  const emptyStateCopy = getEmptyStateCopy(activeCategory, hasBeforePhotos);

  const previewPairData = useMemo(() => {
    if (!previewPhoto) return null;

    if (previewPhoto.category === "after" && previewPhoto.pairedBeforePhotoId) {
      const beforePhoto = photoById.get(previewPhoto.pairedBeforePhotoId);
      if (!beforePhoto) return null;
      return {
        context: `Before/after pair — ${getPhotoContextLabel(beforePhoto)}`,
        beforeId: beforePhoto.id,
        afterId: previewPhoto.id,
      };
    }

    if (previewPhoto.category === "before") {
      const pairedAfterPhotos = photos.filter(
        (photo) =>
          photo.category === "after" && photo.pairedBeforePhotoId === previewPhoto.id,
      );
      if (pairedAfterPhotos.length === 0) return null;
      if (pairedAfterPhotos.length === 1) {
        return {
          context: `Before/after pair — ${getPhotoContextLabel(pairedAfterPhotos[0])}`,
          beforeId: previewPhoto.id,
          afterId: pairedAfterPhotos[0].id,
        };
      }
      return {
        context: `Linked to ${pairedAfterPhotos.length} after photos.`,
      };
    }

    return null;
  }, [photoById, photos, previewPhoto]);

  useEffect(() => {
    latestCountCallbackRef.current = onPhotoCountChange;
  }, [onPhotoCountChange]);

  useEffect(() => {
    if (lastReportedCountRef.current === totalPhotoCount) {
      return;
    }

    lastReportedCountRef.current = totalPhotoCount;
    latestCountCallbackRef.current?.(totalPhotoCount);
  }, [totalPhotoCount]);

  useEffect(() => {
    if (!previewPhoto) return;

    const nextPreview = photos.find((photo) => photo.id === previewPhoto.id) ?? null;
    if (!nextPreview) {
      setPreviewPhoto(null);
      return;
    }

    if (nextPreview !== previewPhoto) {
      setPreviewPhoto(nextPreview);
    }
  }, [photos, previewPhoto]);

  useEffect(() => {
    if (!selectedGhostPhoto) {
      setShowGhostCapture(false);
    }
  }, [selectedGhostPhoto]);

  return (
    <div className="space-y-3 rounded-xl border border-[var(--brand-border)] bg-surface-raised p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Job Photos
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-600">
            {canCompare
              ? "Compare any two photos from this job."
              : "Add 2+ photos to enable compare."}
          </p>
        </div>
        <button
          type="button"
          disabled={!canCompare}
          title={
            canCompare
              ? "Open side-by-side compare"
              : "Add at least two photos to compare"
          }
          onClick={() => {
            setCompareInitialFirstId("");
            setCompareInitialSecondId("");
            setCompareAutoStart(false);
            setShowComparison(true);
          }}
          className="shrink-0 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-[11px] font-semibold text-gold transition-all duration-200 hover:bg-gold/15 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Compare
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {categories.map((category) => {
          const active = category === activeCategory;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-xl border px-2 py-2 text-[11px] font-semibold uppercase tracking-wide transition-all duration-200 ${
                active
                  ? "border-gold/30 bg-gold/10 text-gold"
                  : "border-[var(--brand-border)] bg-surface text-zinc-500 hover:border-zinc-600 active:bg-zinc-800"
              }`}
            >
              {getCategoryLabel(category)} ({photosByCategory[category].length})
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-[var(--brand-border)] bg-surface px-3 py-2.5">
        <p className="text-xs font-semibold text-zinc-200">
          Add {getCategoryLabel(activeCategory)} photos
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
          {getAddPhotoHint(activeCategory, hasBeforePhotos)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <PhotoUploadButton
            loading={uploading}
            onFilesSelected={(files) => addPhotos(files, activeCategory)}
          />
          {activeCategory === "after" && hasBeforePhotos && (
            <button
              type="button"
              onClick={() => {
                setGhostReferencePhotoId((current) =>
                  current || beforePhotos[0]?.id || "",
                );
                setShowGhostPicker(true);
              }}
              className="rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-[11px] font-semibold text-gold transition-all duration-200 hover:bg-gold/15 active:scale-[0.97]"
            >
              Use Before as Ghost
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs font-medium text-gold">{error}</p>}

      {loading ? (
        <p className="py-4 text-center text-xs text-zinc-600">Loading photos...</p>
      ) : activePhotos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800/60 bg-surface px-3 py-6 text-center">
          <p className="text-sm font-semibold text-zinc-300">
            {emptyStateCopy.title}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-zinc-600">
            {emptyStateCopy.body}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {activePhotos.map((photo) => (
            <PhotoTile
              key={photo.id}
              photo={photo}
              pairBadge={
                photo.category === "after" && photo.pairedBeforePhotoId
                  ? photoById.has(photo.pairedBeforePhotoId)
                    ? "Before/after pair"
                    : undefined
                  : photo.category === "before" &&
                      (pairedAfterCountByBeforeId[photo.id] ?? 0) > 0
                    ? (pairedAfterCountByBeforeId[photo.id] ?? 0) === 1
                      ? "1 after match"
                      : `${pairedAfterCountByBeforeId[photo.id]} after matches`
                    : undefined
              }
              onClick={() => setPreviewPhoto(photo)}
            />
          ))}
        </div>
      )}

      <PhotoPreviewModal
        photo={previewPhoto}
        pairedContext={previewPairData?.context}
        onComparePaired={
          previewPairData?.beforeId && previewPairData?.afterId
            ? () => {
                setCompareInitialFirstId(previewPairData.beforeId);
                setCompareInitialSecondId(previewPairData.afterId);
                setCompareAutoStart(true);
                setPreviewPhoto(null);
                setShowComparison(true);
              }
            : undefined
        }
        onClose={() => setPreviewPhoto(null)}
        onDelete={deletePhoto}
        onMoveCategory={movePhoto}
        onSaveCaption={updateCaption}
      />
      <BeforeAfterModal
        open={showComparison}
        photos={photos}
        initialFirstPhotoId={compareInitialFirstId}
        initialSecondPhotoId={compareInitialSecondId}
        autoStartCompare={compareAutoStart}
        onClose={() => {
          setShowComparison(false);
          setCompareInitialFirstId("");
          setCompareInitialSecondId("");
          setCompareAutoStart(false);
        }}
      />
      {showGhostPicker && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/90 px-3 pb-6 pt-16 sm:items-center sm:px-4">
          <div className="animate-fade-in-up w-full max-w-xl rounded-2xl border border-[var(--brand-border)] bg-surface-raised p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Ghost Overlay
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-100">
                  Choose a before photo to overlay on your camera.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGhostPicker(false)}
                className="rounded-xl border border-zinc-700/60 bg-surface px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-zinc-500 hover:text-zinc-100 active:scale-[0.97]"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  Before reference
                </label>
                <select
                  value={ghostReferencePhotoId}
                  onChange={(event) => setGhostReferencePhotoId(event.target.value)}
                  className="w-full rounded-xl border border-[var(--brand-border)] bg-surface px-3 py-2.5 text-sm text-zinc-100 outline-none transition-all duration-200 focus:border-gold/40 focus:ring-1 focus:ring-gold/15"
                >
                  {beforePhotos.map((photo, index) => (
                    <option key={photo.id} value={photo.id}>
                      {getPhotoSelectLabel(photo, index)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                disabled={!selectedGhostPhoto}
                onClick={() => {
                  if (!selectedGhostPhoto) return;
                  setShowGhostPicker(false);
                  setShowGhostCapture(true);
                }}
                className="w-full rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-xs font-bold text-gold transition-all duration-200 hover:bg-gold/15 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Open Ghost Camera
              </button>
            </div>
          </div>
        </div>
      )}
      <GhostCaptureModal
        open={showGhostCapture}
        referencePhoto={selectedGhostPhoto}
        onClose={() => setShowGhostCapture(false)}
        onCapture={(file) => {
          void addPhotos([file], "after", {
            pairedBeforePhotoId: selectedGhostPhoto?.id,
          });
          setShowGhostCapture(false);
        }}
      />
    </div>
  );
}

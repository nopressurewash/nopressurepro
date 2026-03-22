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

function PhotoTile({
  photo,
  onClick,
}: {
  photo: JobPhotoRecord;
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
  const selectedGhostPhoto =
    beforePhotos.find((photo) => photo.id === ghostReferencePhotoId) ?? null;

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
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Job Photos
        </p>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <button
            type="button"
            disabled={!canCompare}
            onClick={() => setShowComparison(true)}
            className="rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-[11px] font-semibold text-gold transition-all duration-200 hover:bg-gold/15 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Compare
          </button>
          <PhotoUploadButton
            loading={uploading}
            onFilesSelected={(files) => addPhotos(files, activeCategory)}
          />
          {activeCategory === "after" && beforePhotos.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setGhostReferencePhotoId((current) =>
                  current || beforePhotos[0]?.id || "",
                );
                setShowGhostPicker(true);
              }}
              className="rounded-xl border border-brand-purple/30 bg-brand-purple/10 px-3 py-2 text-[11px] font-semibold text-brand-purple-light transition-all duration-200 hover:bg-brand-purple/15 active:scale-[0.97]"
            >
              Use Before as Ghost
            </button>
          )}
        </div>
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

      {error && <p className="text-xs font-medium text-gold">{error}</p>}

      {loading ? (
        <p className="py-4 text-center text-xs text-zinc-600">Loading photos...</p>
      ) : activePhotos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800/60 bg-surface px-3 py-6 text-center">
          <p className="text-sm font-semibold text-zinc-300">
            No {getCategoryLabel(activeCategory).toLowerCase()} photos yet.
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Add photos for documentation or client records.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {activePhotos.map((photo) => (
            <PhotoTile
              key={photo.id}
              photo={photo}
              onClick={() => setPreviewPhoto(photo)}
            />
          ))}
        </div>
      )}

      <PhotoPreviewModal
        photo={previewPhoto}
        onClose={() => setPreviewPhoto(null)}
        onDelete={deletePhoto}
        onMoveCategory={movePhoto}
        onSaveCaption={updateCaption}
      />
      <BeforeAfterModal
        open={showComparison}
        photos={photos}
        onClose={() => setShowComparison(false)}
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
                  Pick a before photo as your capture guide.
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
                  Before reference image
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
          void addPhotos([file], "after");
          setShowGhostCapture(false);
        }}
      />
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useJobPhotos } from "../../hooks/useJobPhotos";
import { useObjectUrl } from "../../hooks/useObjectUrl";
import type { JobPhotoCategory, JobPhotoRecord } from "../../lib/types";
import { BeforeAfterModal } from "./BeforeAfterModal";
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
  const firstBeforePhoto = photosByCategory.before[0] ?? null;
  const firstAfterPhoto = photosByCategory.after[0] ?? null;

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

  return (
    <div className="space-y-3 rounded-xl border border-[var(--brand-border)] bg-surface-raised p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Job Photos
        </p>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {firstBeforePhoto && firstAfterPhoto && (
            <button
              type="button"
              onClick={() => setShowComparison(true)}
              className="rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-[11px] font-semibold text-gold transition-all duration-200 hover:bg-gold/15 active:scale-[0.97]"
            >
              Compare
            </button>
          )}
          <PhotoUploadButton
            loading={uploading}
            onFilesSelected={(files) => addPhotos(files, activeCategory)}
          />
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
        beforePhoto={firstBeforePhoto}
        afterPhoto={firstAfterPhoto}
        onClose={() => setShowComparison(false)}
      />
    </div>
  );
}

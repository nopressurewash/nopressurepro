"use client";

import { useEffect, useMemo, useState } from "react";
import { useJobPhotos } from "../../hooks/useJobPhotos";
import type { JobPhotoCategory, JobPhotoRecord } from "../../lib/types";
import { PhotoPreviewModal } from "./PhotoPreviewModal";
import { PhotoUploadButton } from "./PhotoUploadButton";

interface JobPhotoGalleryProps {
  quoteId: string;
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
  const imageUrl = useMemo(() => URL.createObjectURL(photo.blob), [photo.blob]);

  useEffect(() => {
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 text-left"
    >
      <img
        src={imageUrl}
        alt={`${photo.category} job photo`}
        className="aspect-square w-full object-cover transition duration-200 group-hover:scale-[1.02]"
      />
      <div className="px-2.5 py-2">
        <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          {getCategoryLabel(photo.category)}
        </p>
        <p className="mt-1 text-[11px] text-zinc-300">
          {formatDateTime(photo.createdAt)}
        </p>
      </div>
    </button>
  );
}

export function JobPhotoGallery({ quoteId }: JobPhotoGalleryProps) {
  const { photos, loading, uploading, error, addPhotos, deletePhoto, movePhoto } =
    useJobPhotos(quoteId);
  const [activeCategory, setActiveCategory] =
    useState<JobPhotoCategory>("before");
  const [previewPhoto, setPreviewPhoto] = useState<JobPhotoRecord | null>(null);

  const photosByCategory = useMemo(() => {
    return {
      before: photos.filter((photo) => photo.category === "before"),
      after: photos.filter((photo) => photo.category === "after"),
      other: photos.filter((photo) => photo.category === "other"),
    };
  }, [photos]);

  const activePhotos = photosByCategory[activeCategory];

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          Job Photos
        </p>
        <PhotoUploadButton
          loading={uploading}
          onFilesSelected={(files) => addPhotos(files, activeCategory)}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {categories.map((category) => {
          const active = category === activeCategory;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-2xl border px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
                active
                  ? "border-amber-400/80 bg-amber-400/15 text-amber-200"
                  : "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              {getCategoryLabel(category)} ({photosByCategory[category].length})
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-amber-200">{error}</p>}

      {loading ? (
        <p className="text-xs text-zinc-500">Loading photo gallery...</p>
      ) : activePhotos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-black/30 px-3 py-5 text-center">
          <p className="text-sm font-medium text-zinc-100">
            No {getCategoryLabel(activeCategory).toLowerCase()} photos yet.
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Add photos for documentation, client records, or future marketing.
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
      />
    </div>
  );
}


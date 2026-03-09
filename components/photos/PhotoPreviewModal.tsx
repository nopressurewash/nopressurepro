"use client";

import { useEffect, useMemo } from "react";
import type { JobPhotoCategory, JobPhotoRecord } from "../../lib/types";

interface PhotoPreviewModalProps {
  photo: JobPhotoRecord | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onMoveCategory: (id: string, category: JobPhotoCategory) => void;
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

export function PhotoPreviewModal({
  photo,
  onClose,
  onDelete,
  onMoveCategory,
}: PhotoPreviewModalProps) {
  const imageUrl = useMemo(() => {
    if (!photo) return null;
    return URL.createObjectURL(photo.blob);
  }, [photo]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  if (!photo || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 px-3 pb-6 pt-16 sm:items-center sm:px-4">
      <div className="w-full max-w-3xl rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 p-4 shadow-[0_0_60px_rgba(0,0,0,0.9)] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Job Photo
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-100">
              {getCategoryLabel(photo.category)}
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

        <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-800 bg-black">
          <img
            src={imageUrl}
            alt="Job photo preview"
            className="h-auto max-h-[65vh] w-full object-contain"
          />
        </div>

        <div className="mt-3 space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Move to category
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {categories.map((category) => {
                const active = photo.category === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => onMoveCategory(photo.id, category)}
                    className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? "border-amber-400/80 bg-amber-400/15 text-amber-200"
                        : "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    {getCategoryLabel(category)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                onDelete(photo.id);
                onClose();
              }}
              className="rounded-2xl border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/15"
            >
              Delete Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { useObjectUrl } from "../../hooks/useObjectUrl";
import type { JobPhotoCategory, JobPhotoRecord } from "../../lib/types";

interface PhotoPreviewModalProps {
  photo: JobPhotoRecord | null;
  pairedContext?: string;
  onComparePaired?: () => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  onMoveCategory: (id: string, category: JobPhotoCategory) => void;
  onSaveCaption: (id: string, caption: string) => void;
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

const pillBase =
  "rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200";

export function PhotoPreviewModal({
  photo,
  pairedContext,
  onComparePaired,
  onClose,
  onDelete,
  onMoveCategory,
  onSaveCaption,
}: PhotoPreviewModalProps) {
  const imageUrl = useObjectUrl(photo?.blob);
  const [captionDraft, setCaptionDraft] = useState("");

  useEffect(() => {
    setCaptionDraft(photo?.caption ?? "");
  }, [photo]);

  if (!photo || !imageUrl) return null;

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/90 px-3 pb-4 pt-12 sm:items-center sm:px-4 sm:pb-6 sm:pt-16">
      <div className="animate-fade-in-up w-full max-w-3xl rounded-2xl border border-[var(--brand-border)] bg-surface-raised p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Job Photo
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">
              {getCategoryLabel(photo.category)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700/60 bg-surface px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-zinc-500 hover:text-zinc-100 active:scale-[0.97]"
          >
            Close
          </button>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-[var(--brand-border)] bg-black">
          <img
            src={imageUrl}
            alt="Job photo preview"
            className="h-auto max-h-[60vh] w-full object-contain"
          />
        </div>

        <div className="mt-4 space-y-4">
          {pairedContext && (
            <div className="rounded-xl border border-brand-purple/30 bg-brand-purple/10 px-3 py-2.5">
              <p className="text-xs text-brand-purple-light">{pairedContext}</p>
            </div>
          )}
          {onComparePaired && (
            <button
              type="button"
              onClick={onComparePaired}
              className="w-full rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-xs font-bold text-gold transition-all duration-200 hover:bg-gold/15 active:scale-[0.98]"
            >
              Compare Paired Photos
            </button>
          )}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Photo Name / Caption
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                value={captionDraft}
                onChange={(event) => setCaptionDraft(event.target.value)}
                placeholder="Add a photo label for easier compare selection"
                className="flex-1 rounded-xl border border-[var(--brand-border)] bg-surface px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition-all duration-200 focus:border-gold/40 focus:ring-1 focus:ring-gold/15"
              />
              <button
                type="button"
                onClick={() => onSaveCaption(photo.id, captionDraft)}
                className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-xs font-semibold text-gold transition-all duration-200 hover:bg-gold/15 active:scale-[0.97]"
              >
                Save Label
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
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
                    className={`${pillBase} ${
                      active
                        ? "border-gold/30 bg-gold/10 text-gold"
                        : "border-[var(--brand-border)] bg-surface text-zinc-400 hover:border-zinc-600 active:bg-zinc-800"
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
              className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-400 transition-all duration-200 hover:bg-rose-500/15 active:scale-[0.97]"
            >
              Delete Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

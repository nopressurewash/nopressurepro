"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { PhotoPreviewModal } from "../../components/photos/PhotoPreviewModal";
import { Panel } from "../../components/ui/Panel";
import { TextField } from "../../components/ui/FormField";
import { useObjectUrl } from "../../hooks/useObjectUrl";
import { useAuth } from "../../components/auth/AuthProvider";
import { useLocalData } from "../../hooks/useLocalData";
import {
  deletePhotoRecord,
  getAllPhotoRecords,
  updatePhotoRecord,
} from "../../lib/photoStorage";
import type { JobPhotoCategory, JobPhotoRecord, Quote } from "../../lib/types";
import {
  deletePhotoRecord as deleteRemotePhotoRecord,
  getPhotos,
  getRemotePhotoBlob,
  importLocalPhotosIfMissing,
  updatePhotoRecord as updateRemotePhotoRecord,
} from "../../lib/data/photosRepo";

type GalleryFilter = "all" | JobPhotoCategory;

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
    year: "2-digit",
  });
}

function GalleryTile({
  photo,
  quote,
  onClick,
}: {
  photo: JobPhotoRecord;
  quote?: Quote;
  onClick: () => void;
}) {
  const imageUrl = useObjectUrl(photo.blob);

  if (!imageUrl) {
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--brand-border)] bg-surface-raised">
        <div className="aspect-square w-full animate-pulse bg-surface" />
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
      <div className="space-y-1.5 px-3 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
            {getCategoryLabel(photo.category)}
          </span>
          <span className="text-[10px] tabular-nums text-zinc-600">
            {formatDate(photo.createdAt)}
          </span>
        </div>
        <p className="truncate text-sm font-semibold text-zinc-100">
          {quote?.clientName || "Unknown client"}
        </p>
        <p className="truncate text-[11px] text-zinc-500">
          {quote?.serviceType || "Unlinked quote"}
        </p>
      </div>
    </button>
  );
}

export default function GalleryPage() {
  const { businessId } = useAuth();
  const { quotes } = useLocalData();
  const [photos, setPhotos] = useState<JobPhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<GalleryFilter>("all");
  const [search, setSearch] = useState("");
  const [previewPhoto, setPreviewPhoto] = useState<JobPhotoRecord | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPhotos() {
      try {
        setLoading(true);
        setError(null);
        const localPhotos = await getAllPhotoRecords();
        if (!businessId) {
          if (active) {
            setPhotos(localPhotos);
          }
          return;
        }

        const remotePhotos = await getPhotos(businessId);
        if (remotePhotos && remotePhotos.length > 0) {
          const localById = new Map(localPhotos.map((photo) => [photo.id, photo]));
          const resolved = await Promise.all(
            remotePhotos.map(async (remotePhoto) => {
              const local = localById.get(remotePhoto.id);
              if (local) {
                return {
                  ...local,
                  category: remotePhoto.category,
                  caption: remotePhoto.caption,
                  pairedBeforePhotoId: remotePhoto.pairedBeforePhotoId,
                };
              }

              const remoteBlob = await getRemotePhotoBlob(remotePhoto);
              if (!remoteBlob) return null;

              return {
                id: remotePhoto.id,
                quoteId: remotePhoto.quoteId,
                category: remotePhoto.category,
                createdAt: remotePhoto.createdAt,
                caption: remotePhoto.caption,
                pairedBeforePhotoId: remotePhoto.pairedBeforePhotoId,
                blob: remoteBlob,
              } as JobPhotoRecord;
            }),
          );
          const remoteResolved = resolved.filter(
            (photo): photo is JobPhotoRecord => photo !== null,
          );
          const remoteIdSet = new Set(remoteResolved.map((photo) => photo.id));
          const localOnly = localPhotos.filter((photo) => !remoteIdSet.has(photo.id));
          if (active) {
            setPhotos(
              [...remoteResolved, ...localOnly].sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
              ),
            );
          }
          return;
        }

        await importLocalPhotosIfMissing(businessId, localPhotos);
        const imported = await getPhotos(businessId);
        if (imported && imported.length > 0) {
          const importedIds = new Set(imported.map((photo) => photo.id));
          if (active) {
            setPhotos(localPhotos.filter((photo) => importedIds.has(photo.id)));
          }
          return;
        }

        if (active) {
          setPhotos(localPhotos);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Could not load gallery photos.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPhotos();

    return () => {
      active = false;
    };
  }, [businessId]);

  const quoteById = useMemo(
    () => new Map(quotes.map((quote) => [quote.id, quote])),
    [quotes],
  );

  const visiblePhotos = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return photos.filter((photo) => {
      if (filter !== "all" && photo.category !== filter) {
        return false;
      }

      if (!searchTerm) return true;

      const quote = quoteById.get(photo.quoteId);
      const haystack = [
        quote?.clientName,
        quote?.serviceType,
        photo.quoteId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchTerm);
    });
  }, [filter, photos, quoteById, search]);

  async function handleDelete(id: string) {
    await deletePhotoRecord(id);
    if (businessId) {
      await deleteRemotePhotoRecord(businessId, id);
    }
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
  }

  async function handleMoveCategory(id: string, category: JobPhotoCategory) {
    const existing = photos.find((photo) => photo.id === id);
    if (!existing) return;

    const updated = { ...existing, category };
    await updatePhotoRecord(updated);
    if (businessId) {
      await updateRemotePhotoRecord(businessId, updated);
    }
    setPhotos((prev) =>
      prev.map((photo) => (photo.id === id ? updated : photo)),
    );
    setPreviewPhoto((prev) => (prev?.id === id ? updated : prev));
  }

  async function handleSaveCaption(id: string, caption: string) {
    const existing = photos.find((photo) => photo.id === id);
    if (!existing) return;

    const updated = {
      ...existing,
      caption: caption.trim() || undefined,
    };
    await updatePhotoRecord(updated);
    if (businessId) {
      await updateRemotePhotoRecord(businessId, updated);
    }
    setPhotos((prev) =>
      prev.map((photo) => (photo.id === id ? updated : photo)),
    );
    setPreviewPhoto((prev) => (prev?.id === id ? updated : prev));
  }

  const filterOptions: Array<{ value: GalleryFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "before", label: "Before" },
    { value: "after", label: "After" },
    { value: "other", label: "Other" },
  ];

  return (
    <AppShell>
      <section className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            Gallery
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Browse all uploaded quote and job photos in one place.
          </p>
        </div>

        <Panel className="space-y-3 p-3.5">
          <TextField
            label="Search gallery"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name or job type"
          />
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.map((option) => {
              const active = filter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFilter(option.value)}
                  className={`rounded-xl border px-3 py-2 text-[11px] font-semibold transition-all duration-200 active:scale-[0.97] ${
                    active
                      ? "border-gold/40 bg-gold/10 text-gold"
                      : "border-[var(--brand-border)] bg-surface text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </Panel>

        {error && (
          <Panel className="border-amber-500/30 bg-amber-500/10 p-3.5">
            <p className="text-sm font-medium text-amber-300">{error}</p>
          </Panel>
        )}

        {loading ? (
          <Panel className="border-dashed border-zinc-700/60 py-8 text-center">
            <p className="text-sm text-zinc-500">Loading gallery...</p>
          </Panel>
        ) : visiblePhotos.length === 0 ? (
          <Panel className="border-dashed border-zinc-700/60 py-8 text-center">
            <p className="text-base font-bold text-zinc-200">
              No photos found.
            </p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-500">
              Upload photos from Quick Quote or Saved Quotes to see them here.
            </p>
          </Panel>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visiblePhotos.map((photo) => (
              <GalleryTile
                key={photo.id}
                photo={photo}
                quote={quoteById.get(photo.quoteId)}
                onClick={() => setPreviewPhoto(photo)}
              />
            ))}
          </div>
        )}
      </section>

      <PhotoPreviewModal
        photo={previewPhoto}
        onClose={() => setPreviewPhoto(null)}
        onDelete={handleDelete}
        onMoveCategory={handleMoveCategory}
        onSaveCaption={handleSaveCaption}
      />
    </AppShell>
  );
}

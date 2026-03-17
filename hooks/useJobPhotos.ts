"use client";

import { useCallback, useEffect, useState } from "react";
import type { JobPhotoCategory, JobPhotoRecord } from "../lib/types";
import { useAuth } from "../components/auth/AuthProvider";
import {
  addPhotoRecord,
  compressImage,
  deletePhotoRecord,
  getPhotosForQuote,
  updatePhotoRecord,
} from "../lib/photoStorage";
import {
  deletePhotoRecord as deleteRemotePhotoRecord,
  getPhotosByQuoteId,
  getRemotePhotoBlob,
  importLocalPhotosIfMissing,
  savePhotoRecord,
  updatePhotoRecord as updateRemotePhotoRecord,
} from "../lib/data/photosRepo";

export function useJobPhotos(quoteId: string) {
  const { businessId } = useAuth();
  const [photos, setPhotos] = useState<JobPhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPhotos = useCallback(async () => {
    if (!quoteId) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const localPhotos = await getPhotosForQuote(quoteId);
      if (!businessId) {
        setPhotos(localPhotos);
        return;
      }

      const remotePhotos = await getPhotosByQuoteId(businessId, quoteId);
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
              blob: remoteBlob,
            } as JobPhotoRecord;
          }),
        );
        const remoteResolved = resolved.filter(
          (photo): photo is JobPhotoRecord => photo !== null,
        );
        const remoteIdSet = new Set(remoteResolved.map((photo) => photo.id));
        const localOnly = localPhotos.filter((photo) => !remoteIdSet.has(photo.id));
        setPhotos(
          [...remoteResolved, ...localOnly].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );
        return;
      }

      await importLocalPhotosIfMissing(businessId, localPhotos);
      const imported = await getPhotosByQuoteId(businessId, quoteId);
      if (imported && imported.length > 0) {
        const importedIds = new Set(imported.map((photo) => photo.id));
        setPhotos(
          localPhotos.filter((photo) => importedIds.has(photo.id)),
        );
        return;
      }

      setPhotos(localPhotos);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load job photos.",
      );
    } finally {
      setLoading(false);
    }
  }, [quoteId, businessId]);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  const addPhotos = useCallback(
    async (files: File[], category: JobPhotoCategory) => {
      if (!files.length) return;

      try {
        setUploading(true);
        setError(null);

        const created = await Promise.all(
          files.map(async (file) => {
            const blob = await compressImage(file);
            return addPhotoRecord({
              quoteId,
              category,
              blob,
            });
          }),
        );

        setPhotos((prev) =>
          [...created, ...prev].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );

        if (businessId) {
          await Promise.all(
            created.map(async (photo) => {
              await savePhotoRecord(businessId, photo);
            }),
          );
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not add selected photos.",
        );
      } finally {
        setUploading(false);
      }
    },
    [quoteId, businessId],
  );

  const deletePhoto = useCallback(async (id: string) => {
    try {
      setError(null);
      await deletePhotoRecord(id);
      setPhotos((prev) => prev.filter((photo) => photo.id !== id));
      if (businessId) {
        await deleteRemotePhotoRecord(businessId, id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete photo.");
    }
  }, [businessId]);

  const movePhoto = useCallback(
    async (id: string, category: JobPhotoCategory) => {
      const existing = photos.find((photo) => photo.id === id);
      if (!existing) return;

      const updated: JobPhotoRecord = {
        ...existing,
        category,
      };

      try {
        setError(null);
        await updatePhotoRecord(updated);
        setPhotos((prev) =>
          prev.map((photo) => (photo.id === id ? updated : photo)),
        );
        if (businessId) {
          const synced = await updateRemotePhotoRecord(businessId, updated);
          if (!synced) {
            console.info("[photos] skipped remote category sync: quote is local-only", {
              photoId: id,
              quoteId: updated.quoteId,
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not move photo.");
      }
    },
    [photos, businessId],
  );

  const updateCaption = useCallback(
    async (id: string, caption: string) => {
      const existing = photos.find((photo) => photo.id === id);
      if (!existing) return;

      const updated: JobPhotoRecord = {
        ...existing,
        caption: caption.trim() || undefined,
      };

      try {
        setError(null);
        await updatePhotoRecord(updated);
        setPhotos((prev) =>
          prev.map((photo) => (photo.id === id ? updated : photo)),
        );
        if (businessId) {
          const synced = await updateRemotePhotoRecord(businessId, updated);
          if (!synced) {
            console.info("[photos] skipped remote caption sync: quote is local-only", {
              photoId: id,
              quoteId: updated.quoteId,
            });
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not save photo caption.",
        );
      }
    },
    [photos, businessId],
  );

  return {
    photos,
    loading,
    uploading,
    error,
    addPhotos,
    deletePhoto,
    movePhoto,
    updateCaption,
    reload: loadPhotos,
  };
}


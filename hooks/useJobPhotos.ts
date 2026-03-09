"use client";

import { useCallback, useEffect, useState } from "react";
import type { JobPhotoCategory, JobPhotoRecord } from "../lib/types";
import {
  addPhotoRecord,
  compressImage,
  deletePhotoRecord,
  getPhotosForQuote,
  updatePhotoRecord,
} from "../lib/photoStorage";

export function useJobPhotos(quoteId: string) {
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
      const nextPhotos = await getPhotosForQuote(quoteId);
      setPhotos(nextPhotos);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load job photos.",
      );
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

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
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not add selected photos.",
        );
      } finally {
        setUploading(false);
      }
    },
    [quoteId],
  );

  const deletePhoto = useCallback(async (id: string) => {
    try {
      setError(null);
      await deletePhotoRecord(id);
      setPhotos((prev) => prev.filter((photo) => photo.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete photo.");
    }
  }, []);

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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not move photo.");
      }
    },
    [photos],
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
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not save photo caption.",
        );
      }
    },
    [photos],
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


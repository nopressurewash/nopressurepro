"use client";

import { supabaseClient } from "../supabaseClient";
import { toRemoteUuid } from "./remoteId";

export const PHOTO_BUCKET = "quote-photos";

export function buildPhotoStoragePath(
  businessId: string,
  quoteId: string,
  photoId: string,
): string {
  return `businesses/${businessId}/quotes/${toRemoteUuid(quoteId)}/${toRemoteUuid(photoId)}.jpg`;
}

export async function uploadPhotoFile(
  businessId: string,
  quoteId: string,
  photoId: string,
  blob: Blob,
): Promise<{ bucket: string; path: string }> {
  const path = buildPhotoStoragePath(businessId, quoteId, photoId);
  const { error } = await supabaseClient.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, {
      upsert: true,
      contentType: blob.type || "image/jpeg",
    });

  if (error) {
    console.error("Supabase photo upload failed", error);
    throw error;
  }

  return { bucket: PHOTO_BUCKET, path };
}

export async function downloadPhotoFile(path: string): Promise<Blob> {
  const { data, error } = await supabaseClient.storage
    .from(PHOTO_BUCKET)
    .download(path);

  if (error || !data) {
    throw error ?? new Error("Missing photo file.");
  }

  return data;
}

export async function deletePhotoFile(path: string): Promise<void> {
  if (!path) return;

  const { error } = await supabaseClient.storage
    .from(PHOTO_BUCKET)
    .remove([path]);

  if (error) {
    console.error("Supabase photo delete failed", error);
    throw error;
  }
}

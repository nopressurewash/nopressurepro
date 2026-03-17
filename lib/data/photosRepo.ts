"use client";

import type { JobPhotoRecord } from "../types";
import { supabaseClient } from "../supabaseClient";
import { toRemoteUuid } from "./remoteId";

export interface PhotoMetadataRecord {
  id: string;
  quoteId: string;
  category: JobPhotoRecord["category"];
  createdAt: string;
  caption?: string;
}

const PHOTO_COLUMNS = `
  id,
  quote_id,
  category,
  created_at,
  caption,
  metadata
`;

function mapPhotoRow(row: Record<string, unknown>): PhotoMetadataRecord {
  const metadata =
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : {};

  return {
    id: String(metadata.localId ?? row.id ?? ""),
    quoteId: String(metadata.localQuoteId ?? row.quote_id ?? ""),
    category: String(row.category ?? "other") as JobPhotoRecord["category"],
    createdAt: String(row.created_at ?? new Date().toISOString()),
    caption: row.caption ? String(row.caption) : undefined,
  };
}

export async function getPhotos(
  businessId: string,
): Promise<PhotoMetadataRecord[] | null> {
  if (!businessId) return null;

  const { data, error } = await supabaseClient
    .from("quote_photos")
    .select(PHOTO_COLUMNS)
    .eq("business_id", businessId);

  if (error) {
    console.error("Supabase photos fetch failed", error);
    return null;
  }

  if (!data || data.length === 0) return null;
  return data.map(mapPhotoRow);
}

export async function getPhotosByQuoteId(
  businessId: string,
  quoteId: string,
): Promise<PhotoMetadataRecord[] | null> {
  if (!businessId || !quoteId) return null;

  const remoteQuoteId = toRemoteUuid(quoteId);
  const { data, error } = await supabaseClient
    .from("quote_photos")
    .select(PHOTO_COLUMNS)
    .eq("business_id", businessId)
    .eq("quote_id", remoteQuoteId);

  if (error) {
    console.error("Supabase quote photos fetch failed", error);
    return null;
  }

  if (!data || data.length === 0) return null;
  return data.map(mapPhotoRow);
}

export async function savePhotoRecord(
  businessId: string,
  photo: JobPhotoRecord,
): Promise<void> {
  if (!businessId) return;

  const { error } = await supabaseClient.from("quote_photos").upsert(
    {
      id: toRemoteUuid(photo.id),
      business_id: businessId,
      quote_id: toRemoteUuid(photo.quoteId),
      category: photo.category,
      created_at: photo.createdAt,
      caption: photo.caption ?? null,
      metadata: {
        localId: photo.id,
        localQuoteId: photo.quoteId,
      },
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("Supabase photo save failed", error);
    throw error;
  }
}

export async function updatePhotoRecord(
  businessId: string,
  photo: JobPhotoRecord,
): Promise<void> {
  return savePhotoRecord(businessId, photo);
}

export async function deletePhotoRecord(
  businessId: string,
  photoId: string,
): Promise<void> {
  if (!businessId || !photoId) return;

  const { error } = await supabaseClient
    .from("quote_photos")
    .delete()
    .eq("business_id", businessId)
    .eq("id", toRemoteUuid(photoId));

  if (error) {
    console.error("Supabase photo delete failed", error);
    throw error;
  }
}

export async function importLocalPhotosIfMissing(
  businessId: string,
  localPhotos: JobPhotoRecord[],
): Promise<void> {
  if (!businessId || localPhotos.length === 0) return;

  const remote = await getPhotos(businessId);
  if (remote && remote.length > 0) return;

  await Promise.all(
    localPhotos.map(async (photo) => {
      try {
        await savePhotoRecord(businessId, photo);
      } catch (error) {
        console.error("Failed to import photo metadata", photo.id, error);
      }
    }),
  );
}

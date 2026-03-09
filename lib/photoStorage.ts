"use client";

import type { JobPhotoCategory, JobPhotoRecord } from "./types";

const DB_NAME = "nopressurepro-job-photos";
const DB_VERSION = 1;
const STORE_NAME = "jobPhotos";
const QUOTE_ID_INDEX = "quoteId";
const MAX_IMAGE_WIDTH = 1600;
const JPEG_QUALITY = 0.82;

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex(QUOTE_ID_INDEX, "quoteId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to open photo database."));
  });
}

async function readImageDimensions(file: File): Promise<{
  image: HTMLImageElement;
  width: number;
  height: number;
}> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read image file."));
      img.src = objectUrl;
    });

    return {
      image,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function compressImage(file: File): Promise<Blob> {
  const { image, width, height } = await readImageDimensions(file);
  const scale = width > MAX_IMAGE_WIDTH ? MAX_IMAGE_WIDTH / width : 1;
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not compress image.");
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
  });

  if (!blob) {
    throw new Error("Image compression failed.");
  }

  return blob;
}

export async function getPhotosForQuote(
  quoteId: string,
): Promise<JobPhotoRecord[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index(QUOTE_ID_INDEX);
    const request = index.getAll(quoteId);

    request.onsuccess = () => {
      const records = (request.result as JobPhotoRecord[]).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      resolve(records);
    };
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to load job photos."));
  });
}

export async function addPhotoRecord(input: {
  quoteId: string;
  category: JobPhotoCategory;
  blob: Blob;
  caption?: string;
}): Promise<JobPhotoRecord> {
  const db = await openDatabase();

  const record: JobPhotoRecord = {
    id: generateId(),
    quoteId: input.quoteId,
    category: input.category,
    createdAt: new Date().toISOString(),
    blob: input.blob,
    caption: input.caption,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onsuccess = () => resolve(record);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to save photo."));
  });
}

export async function updatePhotoRecord(
  record: JobPhotoRecord,
): Promise<JobPhotoRecord> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onsuccess = () => resolve(record);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to update photo."));
  });
}

export async function deletePhotoRecord(id: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to delete photo."));
  });
}


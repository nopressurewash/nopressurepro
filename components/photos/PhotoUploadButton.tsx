"use client";

import { useEffect, useId, useState } from "react";

interface PhotoUploadButtonProps {
  onFilesSelected: (files: File[]) => void;
  loading?: boolean;
  className?: string;
}

export function PhotoUploadButton({
  onFilesSelected,
  loading = false,
  className = "",
}: PhotoUploadButtonProps) {
  const libraryInputId = useId();
  const cameraInputId = useId();
  const [showCameraActions, setShowCameraActions] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const syncCameraSupport = () => {
      const touchCapable =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      setShowCameraActions(coarsePointerQuery.matches || touchCapable);
    };

    syncCameraSupport();

    coarsePointerQuery.addEventListener("change", syncCameraSupport);
    return () => coarsePointerQuery.removeEventListener("change", syncCameraSupport);
  }, []);

  function handleFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (files.length) {
      onFilesSelected(files);
    }
    event.currentTarget.value = "";
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <input
        id={libraryInputId}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFilesChange}
      />

      {showCameraActions && (
        <>
          <input
            id={cameraInputId}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFilesChange}
          />
          <label
            htmlFor={cameraInputId}
            className={`inline-flex cursor-pointer items-center justify-center rounded-2xl border border-amber-400/80 bg-amber-400/15 px-3 py-2 text-xs font-semibold text-amber-200 transition active:scale-[0.99] hover:bg-amber-400/20 ${loading ? "pointer-events-none opacity-60" : ""}`}
          >
            {loading ? "Uploading..." : "Take Photo"}
          </label>
        </>
      )}

      <label
        htmlFor={libraryInputId}
        className={`inline-flex cursor-pointer items-center justify-center rounded-2xl border border-purple-500/60 bg-gradient-to-r from-purple-800 via-fuchsia-700 to-purple-900 px-3 py-2 text-xs font-semibold text-zinc-50 shadow-[0_0_20px_rgba(147,51,234,0.45)] transition active:scale-[0.99] ${loading ? "pointer-events-none opacity-60" : ""}`}
      >
        {loading
          ? "Uploading..."
          : showCameraActions
            ? "Choose Photo"
            : "+ Add Photo"}
      </label>
    </div>
  );
}


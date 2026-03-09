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

  const btnBase =
    "inline-flex cursor-pointer items-center justify-center rounded-xl px-3 py-2 text-[11px] font-semibold transition-all duration-200 active:scale-[0.97]";

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
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
            className={`${btnBase} border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/15 ${loading ? "pointer-events-none opacity-50" : ""}`}
          >
            {loading ? "Uploading..." : "Take Photo"}
          </label>
        </>
      )}

      <label
        htmlFor={libraryInputId}
        className={`${btnBase} border border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/15 ${loading ? "pointer-events-none opacity-50" : ""}`}
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

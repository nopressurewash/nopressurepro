"use client";

import { useId } from "react";

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
  const inputId = useId();

  return (
    <div>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []).filter((file) =>
            file.type.startsWith("image/"),
          );
          if (files.length) {
            onFilesSelected(files);
          }
          event.currentTarget.value = "";
        }}
      />
      <label
        htmlFor={inputId}
        className={`inline-flex cursor-pointer items-center justify-center rounded-2xl border border-purple-500/60 bg-gradient-to-r from-purple-800 via-fuchsia-700 to-purple-900 px-3 py-2 text-xs font-semibold text-zinc-50 shadow-[0_0_20px_rgba(147,51,234,0.45)] transition active:scale-[0.99] ${loading ? "pointer-events-none opacity-60" : ""} ${className}`}
      >
        {loading ? "Uploading..." : "+ Add Photo"}
      </label>
    </div>
  );
}


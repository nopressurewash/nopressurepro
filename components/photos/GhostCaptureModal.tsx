"use client";

import { useEffect, useRef, useState } from "react";
import { useObjectUrl } from "../../hooks/useObjectUrl";
import type { JobPhotoRecord } from "../../lib/types";

interface GhostCaptureModalProps {
  open: boolean;
  referencePhoto: JobPhotoRecord | null;
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function GhostCaptureModal({
  open,
  referencePhoto,
  onCapture,
  onClose,
}: GhostCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const overlayUrl = useObjectUrl(referencePhoto?.blob);
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(45);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !referencePhoto) return;

    setCameraReady(false);
    setError(null);
    setOverlayEnabled(true);
    setOverlayOpacity(45);

    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Live camera overlay is not supported on this device.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();
        setCameraReady(true);
      } catch {
        setError("Could not access camera. Use the standard Take Photo flow instead.");
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      streamRef.current = null;
    };
  }, [open, referencePhoto]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Capture only the live camera frame. Overlay is guide-only.
    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `after-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onCapture(file);
      },
      "image/jpeg",
      0.95,
    );
  }

  if (!open || !referencePhoto) return null;

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/90 px-3 pb-6 pt-16 sm:items-center sm:px-4">
      <div className="animate-fade-in-up w-full max-w-3xl rounded-2xl border border-[var(--brand-border)] bg-surface-raised p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Ghost Capture
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">
              Line up the live camera with the before overlay.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost rounded-xl px-3 py-1.5 text-xs font-medium active:scale-[0.97]"
          >
            Close
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--brand-border)] bg-black">
          <div className="relative aspect-[3/4] w-full sm:aspect-video">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="h-full w-full object-cover"
            />
            {overlayEnabled && overlayUrl && (
              <img
                src={overlayUrl}
                alt="Ghost overlay reference"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                style={{ opacity: overlayOpacity / 100 }}
              />
            )}
            {!cameraReady && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <p className="text-sm font-medium text-zinc-300">Starting camera...</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {error ? (
            <div className="callout-warning rounded-xl px-3 py-3 text-xs">
              {error}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOverlayEnabled((prev) => !prev)}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 active:scale-[0.97] ${
                    overlayEnabled ? "chip-active-primary" : "chip-inactive"
                  }`}
                >
                  {overlayEnabled ? "Hide Overlay" : "Show Overlay"}
                </button>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    Opacity
                  </span>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    value={overlayOpacity}
                    onChange={(event) => setOverlayOpacity(Number(event.target.value))}
                    className="w-full accent-gold"
                  />
                  <span className="w-10 text-right text-xs tabular-nums text-zinc-400">
                    {overlayOpacity}%
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCapture}
                disabled={!cameraReady}
                className="btn-primary w-full rounded-xl px-4 py-2.5 text-sm font-bold active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Capture After Photo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

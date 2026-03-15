"use client";

import { useEffect, useState } from "react";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { TextAreaField } from "../ui/FormField";
import type { CalendarDayNote, Quote } from "../../lib/types";
import { ScheduleJobCard } from "./ScheduleJobCard";

interface DayJobsModalProps {
  dateKey: string;
  jobs: Quote[];
  dayNote?: CalendarDayNote;
  onClose: () => void;
  onSaveDayNote: (dateKey: string, note: string) => void;
  onMarkCompleted: (id: string) => void;
  onReschedule: (job: Quote) => void;
}

function formatDisplayDate(dateKey: string) {
  const d = new Date(dateKey + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function DayJobsModal({
  dateKey,
  jobs,
  dayNote,
  onClose,
  onSaveDayNote,
  onMarkCompleted,
  onReschedule,
}: DayJobsModalProps) {
  const sorted = [...jobs].sort((a, b) =>
    (a.scheduledTime ?? "").localeCompare(b.scheduledTime ?? ""),
  );
  const [noteDraft, setNoteDraft] = useState(dayNote?.note ?? "");
  const [banner, setBanner] = useState<string | null>(null);
  const { speechStatus, speechMessage, handleVoiceInput } =
    useSpeechToText(setNoteDraft);

  useEffect(() => {
    setNoteDraft(dayNote?.note ?? "");
    setBanner(null);
  }, [dateKey, dayNote?.note]);

  function handleSaveNote() {
    onSaveDayNote(dateKey, noteDraft);
    setBanner(noteDraft.trim() ? "Day note saved." : "Day note cleared.");
  }

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/90 px-3 pb-6 pt-16 sm:items-center sm:px-4">
      <div className="animate-fade-in-up w-full max-w-lg rounded-2xl border border-[var(--brand-border)] bg-surface-raised p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Scheduled Jobs
            </p>
            <p className="mt-1 text-sm font-bold text-zinc-100">
              {formatDisplayDate(dateKey)}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {sorted.length} job{sorted.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700/60 bg-surface px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-zinc-500 hover:text-zinc-100 active:scale-[0.97]"
          >
            Close
          </button>
        </div>

        <div className="mt-4 max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Day Notes
            </p>
            {dayNote?.updatedAt && (
              <p className="mt-1 text-[11px] text-zinc-600">
                Updated{" "}
                {new Date(dayNote.updatedAt).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                  year: "2-digit",
                })}
              </p>
            )}
            <div className="mt-3 space-y-3 rounded-2xl border border-[var(--brand-border)] bg-surface p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Voice input
                  </p>
                  <p
                    className={`mt-1 text-[11px] ${
                      speechStatus === "listening"
                        ? "text-gold"
                        : speechMessage
                          ? "text-amber-300"
                          : "text-zinc-500"
                    }`}
                  >
                    {speechStatus === "listening"
                      ? "Listening..."
                      : speechMessage ?? (speechStatus === "stopped" ? "Stopped" : "Idle")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 active:scale-[0.98] ${
                    speechStatus === "listening"
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                      : "border-gold/40 bg-gold/10 text-gold hover:bg-gold/15"
                  }`}
                >
                  {speechStatus === "listening" ? "Stop Mic" : "Use Mic"}
                </button>
              </div>
              <TextAreaField
                label="Note for this day"
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                rows={4}
                placeholder="Weather reminder, supplies to bring, follow-ups, or personal notes..."
              />
              {banner && (
                <p className="text-xs font-medium text-gold">{banner}</p>
              )}
              <button
                type="button"
                onClick={handleSaveNote}
                className="w-full rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-xs font-bold text-gold transition-all duration-200 hover:bg-gold/15 active:scale-[0.98]"
              >
                {noteDraft.trim() ? "Save Day Note" : "Clear Day Note"}
              </button>
            </div>
          </div>

          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Scheduled Jobs
            </p>
            <div className="space-y-2.5">
              {sorted.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-500">
                  No jobs scheduled for this day.
                </p>
              ) : (
                sorted.map((job) => (
                  <ScheduleJobCard
                    key={job.id}
                    job={job}
                    onMarkCompleted={onMarkCompleted}
                    onReschedule={onReschedule}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

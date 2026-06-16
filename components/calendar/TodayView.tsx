"use client";

import { useEffect, useMemo, useState } from "react";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import type { Quote } from "../../lib/types";
import { formatCurrency } from "../../lib/format";
import { ScheduleJobCard } from "./ScheduleJobCard";
import { TextAreaField } from "../ui/FormField";
import type { CalendarDayNote } from "../../lib/types";

interface TodayViewProps {
  jobs: Quote[];
  dayNote?: CalendarDayNote;
  onSaveDayNote: (dateKey: string, note: string) => void;
  onMarkCompleted: (id: string) => void;
  onReschedule: (job: Quote) => void;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function tomorrowKey() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TodayView({
  jobs,
  dayNote,
  onSaveDayNote,
  onMarkCompleted,
  onReschedule,
}: TodayViewProps) {
  const tk = todayKey();
  const tmk = tomorrowKey();
  const [noteDraft, setNoteDraft] = useState(dayNote?.note ?? "");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const { speechStatus, speechMessage, handleVoiceInput } =
    useSpeechToText(setNoteDraft);

  useEffect(() => {
    setNoteDraft(dayNote?.note ?? "");
    setIsEditingNote(false);
    setBanner(null);
  }, [dayNote?.note]);

  const todayJobs = useMemo(
    () =>
      jobs
        .filter((j) => j.scheduledDate === tk)
        .sort((a, b) => (a.scheduledTime ?? "").localeCompare(b.scheduledTime ?? "")),
    [jobs, tk],
  );

  const tomorrowJobs = useMemo(
    () =>
      jobs
        .filter((j) => j.scheduledDate === tmk)
        .sort((a, b) => (a.scheduledTime ?? "").localeCompare(b.scheduledTime ?? "")),
    [jobs, tmk],
  );

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const nextJobIndex = todayJobs.findIndex((j) => {
    if (!j.scheduledTime) return false;
    const [h, m] = j.scheduledTime.split(":").map(Number);
    return h * 60 + m >= nowMinutes;
  });

  const todayValue = todayJobs
    .filter((j) => j.status === "booked")
    .reduce((sum, j) => sum + j.recommended, 0);

  function handleSaveNote() {
    onSaveDayNote(tk, noteDraft);
    setBanner(noteDraft.trim() ? "Day note saved." : "Day note cleared.");
    if (noteDraft.trim()) {
      setIsEditingNote(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Today summary bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 stat-card-gold rounded-2xl px-4 py-3">
          <p className="label-muted text-gold">
            Today
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-gold-light">
            {todayJobs.length}{" "}
            <span className="text-sm font-medium text-gold/50">
              job{todayJobs.length !== 1 ? "s" : ""}
            </span>
          </p>
        </div>
        <div className="flex-1 stat-card-purple rounded-2xl px-4 py-3">
          <p className="label-muted text-brand-purple-light">
            Value
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-brand-purple-light">
            {formatCurrency(todayValue)}
          </p>
        </div>
      </div>

      {/* Today's jobs */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Day Note
          </p>
          {!isEditingNote ? (
            <button
              type="button"
              onClick={() => {
                setNoteDraft(dayNote?.note ?? "");
                setIsEditingNote(true);
                setBanner(null);
              }}
              className="rounded-xl border border-gold/30 bg-gold/10 px-3 py-1.5 text-[11px] font-semibold text-gold transition-all duration-200 hover:bg-gold/15 active:scale-[0.98]"
            >
              {dayNote?.note ? "Edit note" : "Add note"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setNoteDraft(dayNote?.note ?? "");
                setIsEditingNote(false);
                setBanner(null);
              }}
              className="rounded-xl border border-[var(--brand-border)] bg-surface px-3 py-1.5 text-[11px] font-medium text-zinc-400 transition-all duration-200 hover:border-zinc-600 hover:text-zinc-200 active:scale-[0.98]"
            >
              Cancel
            </button>
          )}
        </div>
        {!isEditingNote ? (
          dayNote?.note ? (
            <div className="mt-3 rounded-2xl border border-[var(--brand-border)] bg-surface px-4 py-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                {dayNote.note}
              </p>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-zinc-800/60 px-4 py-6 text-center">
              <p className="text-sm font-medium text-zinc-400">
                No note for today yet.
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                Add reminders, weather details, or follow-ups for this day.
              </p>
              <button
                type="button"
                onClick={() => {
                  setNoteDraft(dayNote?.note ?? "");
                  setIsEditingNote(true);
                  setBanner(null);
                }}
                className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-bold text-gold transition-all duration-200 hover:bg-gold/15 active:scale-[0.98]"
              >
                Add Note
              </button>
            </div>
          )
        ) : (
          <div className="mt-3 space-y-3 rounded-2xl border border-[var(--brand-border)] bg-surface p-4">
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
                        ? "text-warning"
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
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 active:scale-[0.98] ${
                  speechStatus === "listening" ? "btn-destructive" : "btn-primary"
                }`}
              >
                {speechStatus === "listening" ? "Stop Mic" : "Use Mic"}
              </button>
            </div>
            <TextAreaField
              label="Note for today"
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              rows={4}
              placeholder="Weather reminder, supplies to bring, follow-ups, or personal notes..."
            />
            {banner && <p className="text-xs font-medium text-gold">{banner}</p>}
            <button
              type="button"
              onClick={handleSaveNote}
              className="btn-primary w-full rounded-xl px-4 py-2.5 text-xs font-bold active:scale-[0.98]"
            >
              {noteDraft.trim() ? "Save Day Note" : "Clear Day Note"}
            </button>
          </div>
        )}
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Today&rsquo;s Jobs
        </p>
        {todayJobs.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-zinc-800/60 py-10 text-center">
            <p className="text-sm font-bold text-zinc-300">Nothing scheduled today.</p>
            <p className="mt-1 text-xs text-zinc-600">
              Schedule jobs from Saved Quotes to fill the day.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-2.5">
            {todayJobs.map((job, i) => (
              <ScheduleJobCard
                key={job.id}
                job={job}
                isNext={i === nextJobIndex && job.status === "booked"}
                onMarkCompleted={onMarkCompleted}
                onReschedule={onReschedule}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tomorrow preview */}
      {tomorrowJobs.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Tomorrow
          </p>
          <div className="mt-3 space-y-2.5">
            {tomorrowJobs.map((job) => (
              <ScheduleJobCard
                key={job.id}
                job={job}
                onMarkCompleted={onMarkCompleted}
                onReschedule={onReschedule}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

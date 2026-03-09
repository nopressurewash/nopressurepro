"use client";

import type { Quote } from "../../lib/types";
import { ScheduleJobCard } from "./ScheduleJobCard";

interface DayJobsModalProps {
  dateKey: string;
  jobs: Quote[];
  onClose: () => void;
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
  onClose,
  onMarkCompleted,
  onReschedule,
}: DayJobsModalProps) {
  const sorted = [...jobs].sort((a, b) =>
    (a.scheduledTime ?? "").localeCompare(b.scheduledTime ?? ""),
  );

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/90 px-3 pb-6 pt-16 sm:items-center sm:px-4">
      <div className="animate-fade-in-up w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
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
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-zinc-500 hover:text-zinc-100 active:scale-[0.97]"
          >
            Close
          </button>
        </div>

        <div className="mt-4 max-h-[60vh] space-y-2.5 overflow-y-auto">
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
  );
}

"use client";

import type { Quote } from "../../lib/types";
import { formatCurrency } from "../../lib/format";
import {
  getQuoteStatusClasses,
  getQuoteStatusLabel,
} from "../../lib/quoteStatus";

interface DayJobsModalProps {
  dateKey: string;
  jobs: Quote[];
  onClose: () => void;
  onMarkCompleted: (id: string) => void;
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

function formatTime(time?: string) {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = Number(h);
  if (Number.isNaN(hour)) return time;
  const suffix = hour >= 12 ? "pm" : "am";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m}${suffix}`;
}

export function DayJobsModal({
  dateKey,
  jobs,
  onClose,
  onMarkCompleted,
}: DayJobsModalProps) {
  const sorted = [...jobs].sort((a, b) => {
    const ta = a.scheduledTime ?? "";
    const tb = b.scheduledTime ?? "";
    return ta.localeCompare(tb);
  });

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
              <div
                key={job.id}
                className="rounded-xl border border-zinc-800/80 bg-black/40 p-3.5 transition-colors duration-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-zinc-100">
                      {job.clientName}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {job.suburb}
                      {job.scheduledTime && (
                        <span className="ml-1.5 font-medium text-amber-400/80">
                          {formatTime(job.scheduledTime)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums text-amber-400">
                      {formatCurrency(job.recommended)}
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getQuoteStatusClasses(job.status)}`}
                    >
                      {getQuoteStatusLabel(job.status)}
                    </span>
                  </div>
                </div>

                {job.serviceType && (
                  <p className="mt-2 text-[11px] text-zinc-500">
                    {job.serviceType}
                  </p>
                )}

                {job.status === "booked" && (
                  <button
                    type="button"
                    onClick={() => onMarkCompleted(job.id)}
                    className="mt-3 w-full rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition-all duration-200 hover:bg-emerald-500/15 active:scale-[0.98]"
                  >
                    Mark Completed
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

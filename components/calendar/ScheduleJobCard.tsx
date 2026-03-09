"use client";

import Link from "next/link";
import type { Quote } from "../../lib/types";
import { formatCurrency } from "../../lib/format";
import {
  getQuoteStatusClasses,
  getQuoteStatusLabel,
} from "../../lib/quoteStatus";

interface ScheduleJobCardProps {
  job: Quote;
  isNext?: boolean;
  showDate?: boolean;
  onMarkCompleted: (id: string) => void;
  onReschedule: (job: Quote) => void;
}

function formatTime(time?: string) {
  if (!time) return null;
  const [h, m] = time.split(":");
  const hour = Number(h);
  if (Number.isNaN(hour)) return time;
  const suffix = hour >= 12 ? "pm" : "am";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m} ${suffix}`;
}

function formatShortDate(dateKey: string) {
  const d = new Date(dateKey + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

export function ScheduleJobCard({
  job,
  isNext = false,
  showDate = false,
  onMarkCompleted,
  onReschedule,
}: ScheduleJobCardProps) {
  const time = formatTime(job.scheduledTime);

  return (
    <div
      className={`group relative rounded-2xl border p-4 transition-all duration-200 ${
        isNext
          ? "border-amber-500/40 bg-amber-500/[0.04]"
          : "border-zinc-800/80 bg-zinc-950 hover:border-zinc-700"
      }`}
    >
      {isNext && (
        <div className="absolute -top-2.5 left-4 rounded-full bg-amber-500 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-black">
          Next Up
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Time block */}
        <div className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-zinc-800/60 bg-black/60 py-2">
          {time ? (
            <>
              <span className="text-sm font-bold tabular-nums text-amber-400 leading-tight">
                {time.split(" ")[0]}
              </span>
              <span className="text-[9px] font-semibold uppercase text-amber-400/60">
                {time.split(" ")[1]}
              </span>
            </>
          ) : (
            <span className="text-[10px] font-medium text-zinc-600">TBD</span>
          )}
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-zinc-100">
                {job.clientName || "Unnamed"}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {job.suburb || "No suburb"}
                {showDate && job.scheduledDate && (
                  <span className="ml-1 text-zinc-600">
                    · {formatShortDate(job.scheduledDate)}
                  </span>
                )}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold tabular-nums text-amber-400">
                {formatCurrency(job.recommended)}
              </p>
              <span
                className={`mt-0.5 inline-flex rounded-full border px-2 py-[2px] text-[9px] font-bold uppercase tracking-wider ${getQuoteStatusClasses(job.status)}`}
              >
                {getQuoteStatusLabel(job.status)}
              </span>
            </div>
          </div>

          {job.serviceType && (
            <p className="mt-1.5 text-[11px] text-zinc-500">{job.serviceType}</p>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-1.5">
            {job.status === "booked" && (
              <button
                type="button"
                onClick={() => onMarkCompleted(job.id)}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-400 transition-all duration-200 hover:bg-emerald-500/15 active:scale-[0.97]"
              >
                Complete
              </button>
            )}
            <button
              type="button"
              onClick={() => onReschedule(job)}
              className="rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-2.5 py-1.5 text-[10px] font-semibold text-zinc-400 transition-all duration-200 hover:border-zinc-600 hover:text-zinc-200 active:scale-[0.97]"
            >
              Reschedule
            </button>
            <Link
              href="/quotes"
              className="rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-2.5 py-1.5 text-[10px] font-semibold text-zinc-400 transition-all duration-200 hover:border-zinc-600 hover:text-zinc-200 active:scale-[0.97]"
            >
              Open Quote
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

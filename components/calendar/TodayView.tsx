"use client";

import { useMemo } from "react";
import type { Quote } from "../../lib/types";
import { formatCurrency } from "../../lib/format";
import { ScheduleJobCard } from "./ScheduleJobCard";

interface TodayViewProps {
  jobs: Quote[];
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

export function TodayView({ jobs, onMarkCompleted, onReschedule }: TodayViewProps) {
  const tk = todayKey();
  const tmk = tomorrowKey();

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

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Today summary bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-2xl border border-[var(--brand-border-accent)] bg-gold/[0.04] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/70">
            Today
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-gold-light">
            {todayJobs.length}{" "}
            <span className="text-sm font-medium text-gold/50">
              job{todayJobs.length !== 1 ? "s" : ""}
            </span>
          </p>
        </div>
        <div className="flex-1 rounded-2xl border border-brand-purple/20 bg-brand-purple/[0.04] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-purple-light/70">
            Value
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-brand-purple-light">
            {formatCurrency(todayValue)}
          </p>
        </div>
      </div>

      {/* Today's jobs */}
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

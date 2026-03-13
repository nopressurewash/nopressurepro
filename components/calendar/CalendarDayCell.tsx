"use client";

import type { Quote } from "../../lib/types";

interface CalendarDayCellProps {
  day: number;
  dateKey: string;
  isToday: boolean;
  isCurrentMonth: boolean;
  jobs: Quote[];
  onClick: () => void;
}

export function CalendarDayCell({
  day,
  isToday,
  isCurrentMonth,
  jobs,
  onClick,
}: CalendarDayCellProps) {
  const hasJobs = jobs.length > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-h-[72px] flex-col rounded-xl border p-1.5 text-left transition-all duration-200 active:scale-[0.97] sm:min-h-[88px] sm:p-2 ${
        isToday
          ? "border-[var(--brand-border-accent)] bg-gold/[0.05]"
          : hasJobs
            ? "border-zinc-700/60 bg-surface-raised hover:border-zinc-600"
            : "border-[var(--brand-border)] bg-surface hover:border-zinc-700"
      } ${!isCurrentMonth ? "opacity-40" : ""}`}
    >
      <span
        className={`text-[11px] font-bold tabular-nums ${
          isToday
            ? "text-gold"
            : isCurrentMonth
              ? "text-zinc-300"
              : "text-zinc-600"
        }`}
      >
        {day}
      </span>

      {hasJobs && (
        <div className="mt-auto space-y-0.5">
          {jobs.slice(0, 2).map((job) => (
            <p
              key={job.id}
              className="truncate text-[9px] font-medium leading-tight text-zinc-400 sm:text-[10px]"
            >
              {job.clientName}
            </p>
          ))}
          {jobs.length > 2 && (
            <p className="text-[9px] font-semibold text-gold/70 sm:text-[10px]">
              +{jobs.length - 2} more
            </p>
          )}
        </div>
      )}

      {hasJobs && (
        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold/20 text-[9px] font-bold text-gold">
          {jobs.length}
        </span>
      )}
    </button>
  );
}

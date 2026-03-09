"use client";

import { useMemo } from "react";
import type { Quote } from "../../lib/types";
import { ScheduleJobCard } from "./ScheduleJobCard";

interface AgendaViewProps {
  jobs: Quote[];
  onMarkCompleted: (id: string) => void;
  onReschedule: (job: Quote) => void;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatGroupDate(dateKey: string) {
  const d = new Date(dateKey + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateKey;
  const tk = todayKey();
  const tm = new Date();
  tm.setDate(tm.getDate() + 1);
  const tmk = `${tm.getFullYear()}-${String(tm.getMonth() + 1).padStart(2, "0")}-${String(tm.getDate()).padStart(2, "0")}`;
  if (dateKey === tk) return "Today";
  if (dateKey === tmk) return "Tomorrow";
  return d.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function isDatePast(dateKey: string) {
  return dateKey < todayKey();
}

interface DayGroup {
  dateKey: string;
  label: string;
  isPast: boolean;
  jobs: Quote[];
}

export function AgendaView({ jobs, onMarkCompleted, onReschedule }: AgendaViewProps) {
  const groups = useMemo(() => {
    const map = new Map<string, Quote[]>();
    for (const j of jobs) {
      if (!j.scheduledDate) continue;
      const existing = map.get(j.scheduledDate);
      if (existing) existing.push(j);
      else map.set(j.scheduledDate, [j]);
    }

    const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));

    const result: DayGroup[] = sorted.map(([dateKey, dayJobs]) => ({
      dateKey,
      label: formatGroupDate(dateKey),
      isPast: isDatePast(dateKey),
      jobs: dayJobs.sort((a, b) =>
        (a.scheduledTime ?? "").localeCompare(b.scheduledTime ?? ""),
      ),
    }));

    return result;
  }, [jobs]);

  const upcomingGroups = groups.filter((g) => !g.isPast);
  const pastGroups = groups.filter((g) => g.isPast);

  if (groups.length === 0) {
    return (
      <div className="animate-fade-in-up rounded-2xl border border-dashed border-zinc-800 py-12 text-center">
        <p className="text-sm font-bold text-zinc-300">No scheduled jobs yet.</p>
        <p className="mt-1 text-xs text-zinc-600">
          Schedule jobs from Saved Quotes to build your agenda.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      {upcomingGroups.map((group) => (
        <div key={group.dateKey}>
          <div className="sticky top-0 z-10 -mx-1 flex items-center gap-3 bg-black/95 px-1 py-2 backdrop-blur-sm">
            <div
              className={`h-2 w-2 rounded-full ${
                group.label === "Today"
                  ? "bg-amber-400"
                  : "bg-zinc-600"
              }`}
            />
            <p
              className={`text-xs font-bold uppercase tracking-[0.15em] ${
                group.label === "Today" ? "text-amber-400" : "text-zinc-400"
              }`}
            >
              {group.label}
            </p>
            <span className="text-[10px] font-medium tabular-nums text-zinc-600">
              {group.jobs.length} job{group.jobs.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-2.5">
            {group.jobs.map((job) => (
              <ScheduleJobCard
                key={job.id}
                job={job}
                onMarkCompleted={onMarkCompleted}
                onReschedule={onReschedule}
              />
            ))}
          </div>
        </div>
      ))}

      {pastGroups.length > 0 && (
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
            Past
          </p>
          {pastGroups.map((group) => (
            <div key={group.dateKey} className="mb-4 opacity-60">
              <div className="mb-2 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-zinc-700" />
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-600">
                  {group.label}
                </p>
                <span className="text-[10px] font-medium tabular-nums text-zinc-700">
                  {group.jobs.length} job{group.jobs.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2.5">
                {group.jobs.map((job) => (
                  <ScheduleJobCard
                    key={job.id}
                    job={job}
                    onMarkCompleted={onMarkCompleted}
                    onReschedule={onReschedule}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

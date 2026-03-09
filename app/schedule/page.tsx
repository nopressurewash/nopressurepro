"use client";

import { AppShell } from "../../components/layout/AppShell";
import { Panel } from "../../components/ui/Panel";
import { JobCalendar } from "../../components/calendar/JobCalendar";
import { useLocalData } from "../../hooks/useLocalData";
import { useScheduledJobs } from "../../hooks/useScheduledJobs";
import { formatCurrency } from "../../lib/format";

export default function SchedulePage() {
  const { quotes, updateQuoteStatus } = useLocalData();
  const { scheduledJobs, jobsByDate, getJobsForDate } = useScheduledJobs(quotes);

  const bookedCount = scheduledJobs.filter((j) => j.status === "booked").length;
  const totalScheduledValue = scheduledJobs
    .filter((j) => j.status === "booked")
    .reduce((sum, j) => sum + j.recommended, 0);

  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            Schedule
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            View and manage your upcoming jobs on the calendar.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400">
              Booked Jobs
            </p>
            <p className="mt-1.5 text-xl font-bold tabular-nums text-amber-300">
              {bookedCount}
            </p>
          </div>
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.05] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-400">
              Scheduled Value
            </p>
            <p className="mt-1.5 text-xl font-bold tabular-nums text-purple-300">
              {formatCurrency(totalScheduledValue)}
            </p>
          </div>
        </div>

        <Panel className="p-3 sm:p-4">
          <JobCalendar
            jobsByDate={jobsByDate}
            getJobsForDate={getJobsForDate}
            onMarkCompleted={(id) => updateQuoteStatus(id, "completed")}
          />
        </Panel>

        {scheduledJobs.length === 0 && (
          <Panel className="border-dashed border-zinc-700 py-8 text-center">
            <p className="text-base font-bold text-zinc-200">
              No scheduled jobs yet.
            </p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-500">
              Schedule a job from the Saved Quotes page to see it appear here on
              the calendar.
            </p>
          </Panel>
        )}
      </section>
    </AppShell>
  );
}

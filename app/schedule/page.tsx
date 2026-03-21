"use client";

import { useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Panel } from "../../components/ui/Panel";
import { JobCalendar } from "../../components/calendar/JobCalendar";
import { TodayView } from "../../components/calendar/TodayView";
import { AgendaView } from "../../components/calendar/AgendaView";
import { ScheduleJobModal } from "../../components/calendar/ScheduleJobModal";
import { useLocalData } from "../../hooks/useLocalData";
import { useScheduledJobs } from "../../hooks/useScheduledJobs";
import { formatCurrency } from "../../lib/format";
import type { Quote } from "../../lib/types";

type ScheduleTab = "today" | "agenda" | "calendar";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TABS: { id: ScheduleTab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "agenda", label: "Agenda" },
  { id: "calendar", label: "Calendar" },
];

export default function SchedulePage() {
  const { quotes, dayNotes, saveDayNote, updateQuoteStatus, updateQuoteSchedule } =
    useLocalData();
  const { scheduledJobs, jobsByDate, getJobsForDate } =
    useScheduledJobs(quotes);

  const [activeTab, setActiveTab] = useState<ScheduleTab>("today");
  const [reschedulingJob, setReschedulingJob] = useState<Quote | null>(null);
  const todayDateKey = todayKey();

  const bookedJobs = scheduledJobs.filter((j) => j.status === "booked");
  const bookedCount = bookedJobs.length;
  const totalScheduledValue = bookedJobs.reduce(
    (sum, j) => sum + j.recommended,
    0,
  );

  function handleMarkCompleted(id: string) {
    updateQuoteStatus(id, "completed");
  }

  function handleReschedule(job: Quote) {
    setReschedulingJob(job);
  }

  return (
    <AppShell>
      <section className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            Schedule
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {bookedCount > 0
              ? `${bookedCount} upcoming job${bookedCount !== 1 ? "s" : ""} · ${formatCurrency(totalScheduledValue)} booked`
              : "No upcoming jobs scheduled."}
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-2xl border border-[var(--brand-border)] bg-surface-raised p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-[0.15em] transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-gold/10 text-gold"
                  : "text-zinc-500 hover:text-zinc-300 active:bg-zinc-800/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "today" && (
          <TodayView
            jobs={scheduledJobs}
            dayNote={dayNotes[todayDateKey]}
            onSaveDayNote={saveDayNote}
            onMarkCompleted={handleMarkCompleted}
            onReschedule={handleReschedule}
          />
        )}

        {activeTab === "agenda" && (
          <AgendaView
            jobs={scheduledJobs}
            onMarkCompleted={handleMarkCompleted}
            onReschedule={handleReschedule}
          />
        )}

        {activeTab === "calendar" && (
          <Panel className="p-3 sm:p-4">
            <JobCalendar
              jobsByDate={jobsByDate}
              getJobsForDate={getJobsForDate}
              dayNotes={dayNotes}
              onSaveDayNote={saveDayNote}
              onMarkCompleted={handleMarkCompleted}
              onReschedule={handleReschedule}
            />
          </Panel>
        )}

        {/* Empty state across all views */}
        {scheduledJobs.length === 0 && activeTab !== "today" && (
          <div className="rounded-2xl border border-dashed border-zinc-800/60 py-10 text-center">
            <p className="text-sm font-bold text-zinc-300">
              No scheduled jobs yet.
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              Schedule a job from Saved Quotes to see it here.
            </p>
          </div>
        )}
      </section>

      {/* Reschedule modal */}
      {reschedulingJob && (
        <ScheduleJobModal
          quote={reschedulingJob}
          onSchedule={updateQuoteSchedule}
          onClose={() => setReschedulingJob(null)}
        />
      )}
    </AppShell>
  );
}

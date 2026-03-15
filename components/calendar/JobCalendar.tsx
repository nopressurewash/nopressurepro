"use client";

import { useMemo, useState } from "react";
import type { CalendarDayNotesMap, Quote } from "../../lib/types";
import { CalendarDayCell } from "./CalendarDayCell";
import { DayJobsModal } from "./DayJobsModal";

interface JobCalendarProps {
  jobsByDate: Map<string, Quote[]>;
  getJobsForDate: (dateKey: string) => Quote[];
  dayNotes: CalendarDayNotesMap;
  onSaveDayNote: (dateKey: string, note: string) => void;
  onMarkCompleted: (id: string) => void;
  onReschedule: (job: Quote) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getMonthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
  });
}

interface CalendarDay {
  day: number;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
}

function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const today = new Date();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const firstOfMonth = new Date(year, month, 1);
  const startDow = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

  const days: CalendarDay[] = [];

  for (let i = startDow - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const key = toDateKey(prevYear, prevMonth, d);
    days.push({ day: d, dateKey: key, isCurrentMonth: false, isToday: key === todayKey });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const key = toDateKey(year, month, d);
    days.push({ day: d, dateKey: key, isCurrentMonth: true, isToday: key === todayKey });
  }

  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    for (let d = 1; d <= remaining; d++) {
      const key = toDateKey(nextYear, nextMonth, d);
      days.push({ day: d, dateKey: key, isCurrentMonth: false, isToday: key === todayKey });
    }
  }

  return days;
}

export function JobCalendar({
  getJobsForDate,
  dayNotes,
  onSaveDayNote,
  onMarkCompleted,
  onReschedule,
}: JobCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const days = useMemo(
    () => buildCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  function goToPrevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function goToToday() {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }

  const selectedDayJobs = selectedDateKey ? getJobsForDate(selectedDateKey) : [];

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goToPrevMonth}
          className="rounded-xl border border-[var(--brand-border)] bg-surface px-3 py-2 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-zinc-600 hover:text-zinc-200 active:scale-[0.97]"
        >
          ←
        </button>

        <div className="text-center">
          <p className="text-sm font-bold text-zinc-100">
            {getMonthLabel(viewYear, viewMonth)}
          </p>
          <button
            type="button"
            onClick={goToToday}
            className="mt-0.5 text-[10px] font-medium text-gold/70 transition-colors hover:text-gold"
          >
            Today
          </button>
        </div>

        <button
          type="button"
          onClick={goToNextMonth}
          className="rounded-xl border border-[var(--brand-border)] bg-surface px-3 py-2 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-zinc-600 hover:text-zinc-200 active:scale-[0.97]"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-500"
          >
            {wd}
          </div>
        ))}

        {days.map((d) => (
          <CalendarDayCell
            key={d.dateKey}
            day={d.day}
            dateKey={d.dateKey}
            isToday={d.isToday}
            isCurrentMonth={d.isCurrentMonth}
            jobs={getJobsForDate(d.dateKey)}
            dayNote={dayNotes[d.dateKey]}
            onClick={() => setSelectedDateKey(d.dateKey)}
          />
        ))}
      </div>

      {selectedDateKey && (
        <DayJobsModal
          dateKey={selectedDateKey}
          jobs={selectedDayJobs}
          dayNote={dayNotes[selectedDateKey]}
          onSaveDayNote={onSaveDayNote}
          onClose={() => setSelectedDateKey(null)}
          onMarkCompleted={onMarkCompleted}
          onReschedule={onReschedule}
        />
      )}
    </div>
  );
}

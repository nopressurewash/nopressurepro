"use client";

import { useState } from "react";
import type { Quote } from "../../lib/types";
import { formatCurrency } from "../../lib/format";

interface ScheduleJobModalProps {
  quote: Quote;
  onSchedule: (id: string, date: string, time: string) => void;
  onClose: () => void;
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ScheduleJobModal({
  quote,
  onSchedule,
  onClose,
}: ScheduleJobModalProps) {
  const [date, setDate] = useState(quote.scheduledDate || todayString());
  const [time, setTime] = useState(quote.scheduledTime || "09:00");

  function handleSave() {
    if (!date) return;
    onSchedule(quote.id, date, time);
    onClose();
  }

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/90 px-3 pb-6 pt-16 sm:items-center sm:px-4">
      <div className="animate-fade-in-up w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Schedule Job
            </p>
            <p className="mt-1 text-sm font-bold text-zinc-100">
              {quote.clientName}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {quote.suburb} · {formatCurrency(quote.recommended)}
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

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-all duration-200 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 [color-scheme:dark]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-all duration-200 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 [color-scheme:dark]"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-2xl border border-amber-500/50 bg-amber-500/15 px-4 py-3 text-sm font-bold text-amber-400 transition-all duration-200 hover:bg-amber-500/20 active:scale-[0.98]"
          >
            {quote.scheduledDate ? "Update Schedule" : "Schedule Job"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import type { Quote, QuoteStatus } from "../lib/types";

const CALENDAR_STATUSES: QuoteStatus[] = ["booked", "completed", "paid"];

export function useScheduledJobs(quotes: Quote[]) {
  const scheduledJobs = useMemo(
    () =>
      quotes.filter(
        (q) =>
          CALENDAR_STATUSES.includes(q.status) &&
          typeof q.scheduledDate === "string" &&
          q.scheduledDate.length > 0,
      ),
    [quotes],
  );

  const jobsByDate = useMemo(() => {
    const map = new Map<string, Quote[]>();
    for (const job of scheduledJobs) {
      const key = job.scheduledDate!;
      const existing = map.get(key);
      if (existing) {
        existing.push(job);
      } else {
        map.set(key, [job]);
      }
    }
    return map;
  }, [scheduledJobs]);

  function getJobsForDate(dateKey: string): Quote[] {
    return jobsByDate.get(dateKey) ?? [];
  }

  return { scheduledJobs, jobsByDate, getJobsForDate };
}

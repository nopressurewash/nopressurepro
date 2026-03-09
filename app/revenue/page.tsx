"use client";

import { AppShell } from "../../components/layout/AppShell";
import { Panel } from "../../components/ui/Panel";
import { useLocalData } from "../../hooks/useLocalData";
import { formatCurrency } from "../../lib/format";
import { isClosedRevenueStatus } from "../../lib/quoteStatus";
import { Quote } from "../../lib/types";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameWeek(date: Date, today: Date) {
  const oneDay = 24 * 60 * 60 * 1000;
  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay() || 7;
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setTime(startOfWeek.getTime() - (day - 1) * oneDay);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setTime(endOfWeek.getTime() + 6 * oneDay);

  return date >= startOfWeek && date <= endOfWeek;
}

function isSameMonth(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
  );
}

function calculateRevenue(quotes: Quote[]) {
  const completed = quotes.filter((q) => isClosedRevenueStatus(q.status));
  const today = new Date();

  let todayTotal = 0;
  let weekTotal = 0;
  let monthTotal = 0;
  let hoursTotal = 0;
  const serviceCount: Record<string, number> = {};

  for (const q of completed) {
    const d = new Date(q.createdAt);
    if (Number.isNaN(d.getTime())) continue;

    if (isSameDay(d, today)) todayTotal += q.recommended;
    if (isSameWeek(d, today)) weekTotal += q.recommended;
    if (isSameMonth(d, today)) monthTotal += q.recommended;

    if (q.estimatedHours > 0) {
      hoursTotal += q.estimatedHours;
    }

    const key = q.serviceType || "Mixed";
    serviceCount[key] = (serviceCount[key] ?? 0) + q.recommended;
  }

  const averagePerHour =
    hoursTotal > 0
      ? Math.round(
          completed.reduce((s, q) => s + q.recommended, 0) / hoursTotal,
        )
      : 0;

  const topService =
    Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "—";

  return {
    todayTotal,
    weekTotal,
    monthTotal,
    averagePerHour,
    topService,
  };
}

export default function RevenuePage() {
  const { quotes } = useLocalData();

  const { todayTotal, weekTotal, monthTotal, averagePerHour, topService } =
    calculateRevenue(quotes);

  return (
    <AppShell>
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Revenue
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Track what&apos;s actually locked in from completed and paid work.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-black p-4 shadow-[0_0_40px_rgba(16,185,129,0.5)]">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-100/80">
              Today
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-100">
              {formatCurrency(todayTotal)}
            </p>
            <p className="mt-1 text-[11px] text-emerald-100/80">
              Jobs marked completed or paid today.
            </p>
          </div>
          <Panel>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
              This week
            </p>
            <p className="mt-2 text-2xl font-semibold text-zinc-50">
              {formatCurrency(weekTotal)}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Monday–Sunday based on quote dates.
            </p>
          </Panel>
          <Panel>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
              This month
            </p>
            <p className="mt-2 text-2xl font-semibold text-zinc-50">
              {formatCurrency(monthTotal)}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Calendar month across all work.
            </p>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-900/70 via-fuchsia-900/60 to-black p-4 text-sm shadow-[0_0_45px_rgba(147,51,234,0.6)]">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-purple-100/80">
              Avg revenue per hour
            </p>
            <p className="mt-2 text-2xl font-semibold text-purple-100">
              {averagePerHour > 0 ? formatCurrency(averagePerHour) : "-"}
            </p>
            <p className="mt-1 text-[11px] text-purple-100/80">
              Based on hours you estimated on completed or paid work.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/20 via-yellow-400/10 to-black p-4 text-sm shadow-[0_0_40px_rgba(250,204,21,0.5)]">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-100/90">
              Top service type
            </p>
            <p className="mt-2 text-lg font-semibold text-amber-100">
              {topService}
            </p>
            <p className="mt-1 text-[11px] text-amber-50/80">
              The service category bringing in the most closed revenue.
            </p>
          </div>
        </div>

        {quotes.filter((q) => isClosedRevenueStatus(q.status)).length === 0 && (
          <Panel className="border-dashed">
            <p className="text-sm font-medium text-zinc-100">
              No closed revenue yet.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Mark quotes as completed or paid, plus estimated hours, to see
              real numbers here.
            </p>
          </Panel>
        )}
      </section>
    </AppShell>
  );
}


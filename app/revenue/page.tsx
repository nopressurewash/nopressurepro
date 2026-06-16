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
      <section className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            Revenue
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Track closed revenue from completed and paid work.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="stat-card-gold rounded-2xl p-4">
            <p className="label-muted text-gold">
              Today
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-gold-light">
              {formatCurrency(todayTotal)}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Completed or paid today.
            </p>
          </div>
          <Panel>
            <p className="label-muted">
              This week
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--text-primary)]">
              {formatCurrency(weekTotal)}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Monday–Sunday based on quote dates.
            </p>
          </Panel>
          <Panel>
            <p className="label-muted">
              This month
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--text-primary)]">
              {formatCurrency(monthTotal)}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Calendar month across all work.
            </p>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="stat-card-purple rounded-2xl p-4">
            <p className="label-muted text-brand-purple-light">
              Avg revenue per hour
            </p>
            <p className="mt-2 text-2xl font-bold text-brand-purple-light">
              {averagePerHour > 0 ? formatCurrency(averagePerHour) : "-"}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Based on estimated hours on closed work.
            </p>
          </div>

          <div className="stat-card-gold rounded-2xl p-4">
            <p className="label-muted text-gold">
              Top service type
            </p>
            <p className="mt-2 text-lg font-bold text-gold-light">
              {topService}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Highest closed revenue by category.
            </p>
          </div>
        </div>

        {quotes.filter((q) => isClosedRevenueStatus(q.status)).length === 0 && (
          <Panel className="border-dashed border-zinc-700/60">
            <p className="text-sm font-semibold text-zinc-200">
              No closed revenue yet.
            </p>
            <p className="mt-1.5 text-xs text-zinc-500">
              Mark quotes as completed or paid, plus estimated hours, to see
              real numbers here.
            </p>
          </Panel>
        )}
      </section>
    </AppShell>
  );
}

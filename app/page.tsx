"use client";

import { AppShell } from "../components/layout/AppShell";
import { Panel } from "../components/ui/Panel";
import { useLocalData } from "../hooks/useLocalData";
import { formatCurrency } from "../lib/format";
import {
  isClosedRevenueStatus,
  isPipelineRevenueStatus,
} from "../lib/quoteStatus";
import { Quote } from "../lib/types";

function calculateDashboardStats(quotes: Quote[]) {
  const totalQuotes = quotes.length;
  const completedQuotes = quotes.filter((q) => isClosedRevenueStatus(q.status));
  const pipelineQuotes = quotes.filter((q) => isPipelineRevenueStatus(q.status));

  const totalCompletedRevenue = completedQuotes.reduce(
    (sum, q) => sum + q.recommended,
    0,
  );
  const totalProjectedRevenue = pipelineQuotes.reduce(
    (sum, q) => sum + q.recommended,
    0,
  );

  const averageQuoteValue =
    totalQuotes === 0
      ? 0
      : quotes.reduce((sum, q) => sum + q.recommended, 0) / totalQuotes;

  const completionRate =
    totalQuotes === 0 ? 0 : (completedQuotes.length / totalQuotes) * 100;

  const latestQuote = quotes[0];
  const liveRevenuePerHour = latestQuote?.revenuePerHour ?? 0;

  return {
    totalCompletedRevenue,
    totalProjectedRevenue,
    averageQuoteValue,
    completionRate,
    liveRevenuePerHour,
  };
}

export default function DashboardPage() {
  const { quotes, loaded } = useLocalData();

  const {
    totalCompletedRevenue,
    totalProjectedRevenue,
    averageQuoteValue,
    completionRate,
    liveRevenuePerHour,
  } = calculateDashboardStats(quotes);

  return (
    <AppShell>
      <section className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Revenue, momentum, and quoting performance.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400">
              Completed Revenue
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-300">
              {formatCurrency(totalCompletedRevenue)}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Completed or paid quotes only.
            </p>
          </div>

          <Panel>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Pipeline Revenue
            </p>
            <p className="mt-2 text-2xl font-bold text-zinc-100">
              {formatCurrency(totalProjectedRevenue)}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Sent, approved, and booked work.
            </p>
          </Panel>

          <Panel>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Average Quote
            </p>
            <p className="mt-2 text-2xl font-bold text-zinc-100">
              {formatCurrency(averageQuoteValue)}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Across every saved quote.
            </p>
          </Panel>

          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.05] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-400">
              Completion Rate
            </p>
            <p className="mt-2 text-2xl font-bold text-purple-300">
              {completionRate.toFixed(0)}%
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Completed or paid vs total.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.05] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-400">
            Live Revenue / Hour
          </p>
          <p className="mt-2 text-2xl font-bold text-purple-300">
            {liveRevenuePerHour > 0 ? formatCurrency(liveRevenuePerHour) : "-"}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            From your latest quick quote.
          </p>
        </div>

        {!loaded && (
          <p className="text-xs text-zinc-600">
            Loading your local data&hellip;
          </p>
        )}

        {loaded && quotes.length === 0 && (
          <Panel className="mt-2 border-dashed border-zinc-700">
            <p className="text-sm font-semibold text-zinc-200">
              No quotes yet.
            </p>
            <p className="mt-1.5 text-xs text-zinc-500">
              Jump into the Quick Quote Builder to price your first driveway,
              then save it to see live numbers here.
            </p>
          </Panel>
        )}
      </section>
    </AppShell>
  );
}

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
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Glance at revenue, momentum, and quoting performance.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-yellow-500/25 bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-fuchsia-700/20 p-4 shadow-[0_0_40px_rgba(250,204,21,0.25)]">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-yellow-300/80">
              Completed Revenue
            </p>
            <p className="mt-2 text-2xl font-semibold text-yellow-200">
              {formatCurrency(totalCompletedRevenue)}
            </p>
            <p className="mt-1 text-[11px] text-zinc-400">
              Only quotes marked completed or paid.
            </p>
          </div>

          <Panel className="border-zinc-800/80 bg-zinc-900/60">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
              Pipeline Revenue
            </p>
            <p className="mt-2 text-2xl font-semibold text-zinc-50">
              {formatCurrency(totalProjectedRevenue)}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Sent, approved, and booked work still in the pipeline.
            </p>
          </Panel>

          <Panel className="border-zinc-800/80 bg-zinc-900/60">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
              Average Quote
            </p>
            <p className="mt-2 text-2xl font-semibold text-zinc-50">
              {formatCurrency(averageQuoteValue)}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Across every quote you&apos;ve saved.
            </p>
          </Panel>

          <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-900/60 via-fuchsia-900/50 to-black p-4 shadow-[0_0_45px_rgba(147,51,234,0.5)]">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-purple-200/80">
              Completion Rate
            </p>
            <p className="mt-2 text-2xl font-semibold text-purple-100">
              {completionRate.toFixed(0)}%
            </p>
            <p className="mt-1 text-[11px] text-purple-200/70">
              Completed or paid quotes vs total pipeline.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-900/60 via-fuchsia-900/50 to-black p-4 shadow-[0_0_45px_rgba(147,51,234,0.5)]">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-purple-200/80">
            Live Revenue / Hour
          </p>
          <p className="mt-2 text-2xl font-semibold text-purple-100">
            {liveRevenuePerHour > 0 ? formatCurrency(liveRevenuePerHour) : "-"}
          </p>
          <p className="mt-1 text-[11px] text-purple-200/70">
            From your latest quick quote.
          </p>
        </div>

        {!loaded && (
          <p className="text-xs text-zinc-500">
            Loading your local data&hellip;
          </p>
        )}

        {loaded && quotes.length === 0 && (
          <Panel className="mt-2 border-dashed">
            <p className="text-sm font-medium text-zinc-100">
              No quotes yet.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Jump into the Quick Quote Builder to price your first driveway,
              then save it to see live numbers here.
            </p>
          </Panel>
        )}
      </section>
    </AppShell>
  );
}


"use client";

import Link from "next/link";
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
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Revenue, momentum, and quoting performance.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="animate-fade-in-up rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400">
              Completed Revenue
            </p>
            <p className="mt-2.5 text-2xl font-bold tabular-nums text-amber-300">
              {formatCurrency(totalCompletedRevenue)}
            </p>
            <p className="mt-1.5 text-[11px] text-zinc-500">
              Completed or paid quotes only.
            </p>
          </div>

          <div className="animate-fade-in-up animate-delay-75">
            <Panel className="h-full">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Pipeline Revenue
              </p>
              <p className="mt-2.5 text-2xl font-bold tabular-nums text-zinc-100">
                {formatCurrency(totalProjectedRevenue)}
              </p>
              <p className="mt-1.5 text-[11px] text-zinc-500">
                Sent, approved, and booked work.
              </p>
            </Panel>
          </div>

          <div className="animate-fade-in-up animate-delay-75">
            <Panel className="h-full">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Average Quote
              </p>
              <p className="mt-2.5 text-2xl font-bold tabular-nums text-zinc-100">
                {formatCurrency(averageQuoteValue)}
              </p>
              <p className="mt-1.5 text-[11px] text-zinc-500">
                Across every saved quote.
              </p>
            </Panel>
          </div>

          <div className="animate-fade-in-up animate-delay-150 rounded-2xl border border-purple-500/20 bg-purple-500/[0.05] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-400">
              Completion Rate
            </p>
            <p className="mt-2.5 text-2xl font-bold tabular-nums text-purple-300">
              {completionRate.toFixed(0)}%
            </p>
            <p className="mt-1.5 text-[11px] text-zinc-500">
              Completed or paid vs total.
            </p>
          </div>
        </div>

        <div className="animate-fade-in-up animate-delay-150 rounded-2xl border border-purple-500/20 bg-purple-500/[0.05] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-400">
            Live Revenue / Hour
          </p>
          <p className="mt-2.5 text-2xl font-bold tabular-nums text-purple-300">
            {liveRevenuePerHour > 0 ? formatCurrency(liveRevenuePerHour) : "-"}
          </p>
          <p className="mt-1.5 text-[11px] text-zinc-500">
            From your latest quick quote.
          </p>
        </div>

        {!loaded && (
          <p className="text-xs text-zinc-600">
            Loading your local data&hellip;
          </p>
        )}

        {loaded && quotes.length === 0 && (
          <div className="animate-fade-in-up animate-delay-150 rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 p-6 text-center">
            <p className="text-base font-bold text-zinc-200">
              Ready to quote your first job?
            </p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-500">
              Price a driveway, patio, or house wash in under a minute with the
              Quick Quote builder.
            </p>
            <Link
              href="/quote"
              className="mt-4 inline-flex rounded-xl border border-amber-500/50 bg-amber-500/15 px-5 py-2.5 text-sm font-bold text-amber-400 transition-all duration-200 hover:bg-amber-500/20 active:scale-[0.98]"
            >
              Start a Quote
            </Link>
          </div>
        )}
      </section>
    </AppShell>
  );
}

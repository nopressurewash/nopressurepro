"use client";

import { AppShell } from "../components/layout/AppShell";
import { Panel } from "../components/ui/Panel";
import { useLocalData } from "../hooks/useLocalData";
import { formatCurrency } from "../lib/format";
import { Quote } from "../lib/types";

function calculateDashboardStats(quotes: Quote[]) {
  const totalQuotes = quotes.length;
  const wonQuotes = quotes.filter((q) => q.status === "won");

  const totalWonRevenue = wonQuotes.reduce(
    (sum, q) => sum + q.recommended,
    0,
  );

  const averageQuoteValue =
    totalQuotes === 0
      ? 0
      : quotes.reduce((sum, q) => sum + q.recommended, 0) / totalQuotes;

  const winRate =
    totalQuotes === 0 ? 0 : (wonQuotes.length / totalQuotes) * 100;

  const latestQuote = quotes[0];
  const liveRevenuePerHour = latestQuote?.revenuePerHour ?? 0;

  return {
    totalWonRevenue,
    averageQuoteValue,
    winRate,
    liveRevenuePerHour,
  };
}

export default function DashboardPage() {
  const { quotes, loaded } = useLocalData();

  const { totalWonRevenue, averageQuoteValue, winRate, liveRevenuePerHour } =
    calculateDashboardStats(quotes);

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
              Total Won Revenue
            </p>
            <p className="mt-2 text-2xl font-semibold text-yellow-200">
              {formatCurrency(totalWonRevenue)}
            </p>
            <p className="mt-1 text-[11px] text-zinc-400">
              Closed work based on saved quotes.
            </p>
          </div>

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

          <Panel className="border-zinc-800/80 bg-zinc-900/60">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
              Win Rate
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-400">
              {winRate.toFixed(0)}%
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Won vs total saved quotes.
            </p>
          </Panel>

          <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-900/60 via-fuchsia-900/50 to-black p-4 shadow-[0_0_45px_rgba(147,51,234,0.5)]">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-purple-200/80">
              Live Revenue / Hour
            </p>
            <p className="mt-2 text-2xl font-semibold text-purple-100">
              {liveRevenuePerHour > 0
                ? formatCurrency(liveRevenuePerHour)
                : "-"}
            </p>
            <p className="mt-1 text-[11px] text-purple-200/70">
              From your latest quick quote.
            </p>
          </div>
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


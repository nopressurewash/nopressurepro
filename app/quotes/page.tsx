"use client";

import { AppShell } from "../../components/layout/AppShell";
import { Panel } from "../../components/ui/Panel";
import { useLocalData } from "../../hooks/useLocalData";
import { formatCurrency } from "../../lib/format";
import type { QuoteStatus } from "../../lib/types";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
  });
}

const statusOptions: QuoteStatus[] = ["pending", "scheduled", "won", "lost"];

export default function SavedQuotesPage() {
  const { quotes, deleteQuote, updateQuoteStatus } = useLocalData();

  return (
    <AppShell>
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Saved Quotes
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Every quote you lock in from the builder, ready to follow up.
          </p>
        </div>

        {quotes.length === 0 ? (
          <Panel className="border-dashed">
            <p className="text-sm font-medium text-zinc-100">
              No saved quotes yet.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Use the Quick Quote Builder to price a job, then tap &ldquo;Save
              quote&rdquo; to store it here.
            </p>
          </Panel>
        ) : (
          <div className="space-y-3">
            {quotes.map((q) => (
              <Panel
                key={q.id}
                className="space-y-2 p-3.5 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-semibold text-zinc-50">
                      {q.clientName || "Unnamed client"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {q.suburb || "Suburb unknown"} · {q.phone || "No phone"}
                    </p>
                  </div>
                  <p className="text-right text-base font-semibold text-amber-200">
                    {formatCurrency(q.recommended)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <p className="text-zinc-400">
                    {q.serviceType} · {formatDate(q.createdAt)}
                  </p>
                  <p className="text-zinc-500">
                    {q.estimatedHours > 0
                      ? `${q.estimatedHours.toFixed(1)}h · ${formatCurrency(q.revenuePerHour)}/hr`
                      : "-"}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-zinc-500">
                      Status
                    </label>
                    <select
                      value={q.status}
                      onChange={(e) =>
                        updateQuoteStatus(q.id, e.target.value as QuoteStatus)
                      }
                      className="rounded-full border border-zinc-700 bg-black/60 px-3 py-1 text-[11px] text-zinc-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteQuote(q.id)}
                    className="text-[11px] text-zinc-500 underline-offset-2 hover:text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </div>
                {q.notes && (
                  <p className="mt-1 text-[11px] text-zinc-400">
                    {q.notes.length > 160
                      ? `${q.notes.slice(0, 160)}…`
                      : q.notes}
                  </p>
                )}
              </Panel>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}


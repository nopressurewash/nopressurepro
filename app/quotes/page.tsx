"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../components/layout/AppShell";
import { ScheduleJobModal } from "../../components/calendar/ScheduleJobModal";
import { EditQuoteModal } from "../../components/quotes/EditQuoteModal";
import { JobPhotoGallery } from "../../components/photos/JobPhotoGallery";
import { Panel } from "../../components/ui/Panel";
import { useLocalData } from "../../hooks/useLocalData";
import { formatCurrency } from "../../lib/format";
import { buildInvoiceFromQuote } from "../../lib/invoiceUtils";
import { getPhotoCountsForQuoteIds } from "../../lib/photoStorage";
import { exportQuotePdf } from "../../lib/pdf/exportQuotePdf";
import {
  getQuoteStatusClasses,
  getQuoteStatusLabel,
  QUOTE_STATUS_OPTIONS,
} from "../../lib/quoteStatus";
import type { Quote, QuoteStatus } from "../../lib/types";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
  });
}

const actionLink =
  "rounded-lg px-2 py-1 text-[11px] font-medium transition-all duration-200 active:scale-[0.97]";

export default function SavedQuotesPage() {
  const {
    quotes,
    rates,
    invoices,
    addInvoice,
    updateQuote,
    deleteQuote,
    updateQuoteStatus,
    updateQuoteSchedule,
  } = useLocalData();
  const router = useRouter();
  const [expandedPhotoQuoteId, setExpandedPhotoQuoteId] = useState<
    string | null
  >(null);
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});
  const [schedulingQuote, setSchedulingQuote] = useState<Quote | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editSavedBanner, setEditSavedBanner] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCounts() {
      try {
        const counts = await getPhotoCountsForQuoteIds(quotes.map((quote) => quote.id));
        if (active) {
          setPhotoCounts(counts);
        }
      } catch {
        if (active) {
          setPhotoCounts({});
        }
      }
    }

    void loadCounts();

    return () => {
      active = false;
    };
  }, [quotes]);

  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            Saved Quotes
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Every quote from the builder, ready to follow up.
          </p>
        </div>

        {quotes.length === 0 ? (
          <Panel className="border-dashed border-zinc-700/60 py-8 text-center">
            <p className="text-base font-bold text-zinc-200">
              No saved quotes yet.
            </p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-500">
              Use the Quick Quote Builder to price a job, then tap &ldquo;Save
              quote&rdquo; to store it here.
            </p>
          </Panel>
        ) : (
          <div className="space-y-3">
            {quotes.map((q) => (
              <Panel
                key={q.id}
                className="space-y-3 p-4 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-zinc-100">
                      {q.clientName || "Unnamed client"}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {q.suburb || "Suburb unknown"} · {q.phone || "No phone"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-bold tabular-nums text-gold">
                      {formatCurrency(q.recommended)}
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${getQuoteStatusClasses(
                        q.status,
                      )}`}
                    >
                      {getQuoteStatusLabel(q.status)}
                    </span>
                  </div>
                </div>

                {q.scheduledDate && (
                  <p className="flex items-center gap-1.5 text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="font-medium text-emerald-400/80">
                      {formatDate(q.scheduledDate)}
                      {q.scheduledTime && ` at ${q.scheduledTime}`}
                    </span>
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
                  <p>
                    {q.serviceType} · {formatDate(q.createdAt)}
                  </p>
                  <p className="tabular-nums">
                    {q.estimatedHours > 0
                      ? `${q.estimatedHours.toFixed(1)}h · ${formatCurrency(q.revenuePerHour)}/hr`
                      : "-"}
                    {(photoCounts[q.id] ?? 0) > 0 && (
                      <span className="ml-2 text-zinc-600">
                        · {photoCounts[q.id]} photos
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--brand-border)] pt-3">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-medium text-zinc-500">
                      Status
                    </label>
                    <select
                      value={q.status}
                      onChange={(e) =>
                        updateQuoteStatus(q.id, e.target.value as QuoteStatus)
                      }
                      className="rounded-lg border border-[var(--brand-border)] bg-surface px-2.5 py-1.5 text-[11px] text-zinc-200 outline-none transition-all duration-200 focus:border-gold/40 focus:ring-1 focus:ring-gold/15"
                    >
                      {QUOTE_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {getQuoteStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingQuote(q)}
                      className={`${actionLink} text-zinc-300 hover:bg-zinc-800`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setSchedulingQuote(q)}
                      className={`${actionLink} ${q.scheduledDate ? "text-emerald-400 hover:bg-emerald-500/10" : "text-sky-400 hover:bg-sky-500/10"}`}
                    >
                      {q.scheduledDate ? "Scheduled" : "Schedule"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPhotoQuoteId((current) =>
                          current === q.id ? null : q.id,
                        )
                      }
                      className={`${actionLink} text-gold hover:bg-gold/10`}
                    >
                      {expandedPhotoQuoteId === q.id
                        ? "Hide Photos"
                        : "Photos"}
                    </button>
                    <button
                      type="button"
                      onClick={() => exportQuotePdf(q)}
                      className={`${actionLink} text-brand-purple-light hover:bg-brand-purple/10`}
                    >
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const invoice = buildInvoiceFromQuote(q, invoices);
                        addInvoice(invoice);
                        router.push("/invoices");
                      }}
                      className={`${actionLink} text-gold hover:bg-gold/10`}
                    >
                      To Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteQuote(q.id)}
                      className={`${actionLink} text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400`}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {q.notes && (
                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    {q.notes.length > 160
                      ? `${q.notes.slice(0, 160)}…`
                      : q.notes}
                  </p>
                )}

                {expandedPhotoQuoteId === q.id && (
                  <div className="animate-fade-in-up pt-1">
                    <JobPhotoGallery
                      quoteId={q.id}
                      onPhotoCountChange={(count) =>
                        setPhotoCounts((prev) => {
                          if ((prev[q.id] ?? 0) === count) {
                            return prev;
                          }
                          return { ...prev, [q.id]: count };
                        })
                      }
                    />
                  </div>
                )}
              </Panel>
            ))}
          </div>
        )}
      </section>

      {editSavedBanner && (
        <div className="fixed left-1/2 top-16 z-50 -translate-x-1/2 animate-fade-in rounded-2xl border border-gold/30 bg-surface-raised px-5 py-3 text-xs font-semibold text-gold shadow-lg">
          {editSavedBanner}
        </div>
      )}

      {editingQuote && (
        <EditQuoteModal
          quote={editingQuote}
          rates={rates}
          onSave={(updated) => {
            updateQuote(updated);
            setEditingQuote(null);
            setEditSavedBanner("Quote updated.");
            setTimeout(() => setEditSavedBanner(null), 2400);
          }}
          onClose={() => setEditingQuote(null)}
        />
      )}

      {schedulingQuote && (
        <ScheduleJobModal
          quote={schedulingQuote}
          onSchedule={updateQuoteSchedule}
          onClose={() => setSchedulingQuote(null)}
        />
      )}
    </AppShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../components/layout/AppShell";
import { ScheduleJobModal } from "../../components/calendar/ScheduleJobModal";
import { EmailSendModal } from "../../components/email/EmailSendModal";
import { EditQuoteModal } from "../../components/quotes/EditQuoteModal";
import { JobPhotoGallery } from "../../components/photos/JobPhotoGallery";
import { Panel } from "../../components/ui/Panel";
import { useLocalData } from "../../hooks/useLocalData";
import { formatCurrency } from "../../lib/format";
import { buildInvoiceFromQuote } from "../../lib/invoiceUtils";
import { findClientEmail } from "../../lib/mailto";
import { getPhotoCountsForQuoteIds } from "../../lib/photoStorage";
import { exportQuotePdf } from "../../lib/pdf/exportQuotePdf";
import {
  getQuoteStatusClasses,
  getQuoteStatusLabel,
  QUOTE_STATUS_OPTIONS,
} from "../../lib/quoteStatus";
import type { Invoice, Quote, QuoteStatus } from "../../lib/types";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
  });
}

const primaryAction =
  "rounded-xl border px-3 py-2 text-[11px] font-semibold transition-all duration-200 active:scale-[0.97]";

const secondaryAction =
  "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200 active:scale-[0.97]";

function getStatusHint(quote: Quote): string {
  switch (quote.status) {
    case "draft":
      return "Ready to send or schedule.";
    case "sent":
      return "Waiting on client response.";
    case "approved":
      return quote.scheduledDate
        ? "On your calendar — change the booking below if needed."
        : "Client approved — book a date on your calendar next.";
    case "follow_up":
      return "Needs another touchpoint.";
    case "booked":
      return quote.scheduledDate
        ? "Job booked — see calendar details below."
        : "Mark as booked once the date is confirmed.";
    case "completed":
      return "Work done — invoice if needed.";
    case "paid":
      return "Closed and paid.";
    case "lost":
      return "Marked as lost.";
  }
}

function isReadyToBook(quote: Quote): boolean {
  return quote.status === "approved" && !quote.scheduledDate;
}

function getQuoteCardAccentClass(quote: Quote): string {
  if (quote.scheduledDate) {
    return "callout-gold";
  }
  if (isReadyToBook(quote)) {
    return "callout-purple";
  }
  return "";
}

function getScheduleButtonLabel(quote: Quote): string {
  if (quote.scheduledDate) return "Change booking";
  if (isReadyToBook(quote)) return "Book on calendar";
  return "Schedule job";
}

export default function SavedQuotesPage() {
  const {
    quotes,
    clients,
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
  const [deleteBlockedBanner, setDeleteBlockedBanner] = useState<string | null>(null);
  const [invoiceConfirmQuote, setInvoiceConfirmQuote] = useState<Quote | null>(null);
  const [emailDraftTarget, setEmailDraftTarget] = useState<{
    quote: Quote;
    invoice?: Invoice;
    clientEmail?: string;
  } | null>(null);

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const quoteId = params.get("quote");
    const openPhotos = params.get("photos");
    if (!quoteId || openPhotos !== "1") return;
    if (!quotes.some((quote) => quote.id === quoteId)) return;

    setExpandedPhotoQuoteId(quoteId);
  }, [quotes]);

  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            Saved Quotes
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Follow up, schedule, and close out quotes from the field.
          </p>
        </div>

        {quotes.length === 0 ? (
          <Panel className="border-dashed border-zinc-700/60 py-8 text-center">
            <p className="text-base font-bold text-zinc-200">
              No saved quotes yet.
            </p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-500">
              Build a quote in Quick Quote, then save it here for follow-up.
            </p>
          </Panel>
        ) : (
          <div className="space-y-3">
            {quotes.map((q) => {
              const readyToBook = isReadyToBook(q);
              const openSchedule = () => setSchedulingQuote(q);

              return (
              <Panel
                key={q.id}
                className={`space-y-3 p-4 text-sm ${getQuoteCardAccentClass(q)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-zinc-100">
                      {q.clientName || "Unnamed client"}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {q.suburb || "Suburb unknown"}
                      {q.phone ? ` · ${q.phone}` : ""}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-600">
                      {q.serviceType} · Created {formatDate(q.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-bold tabular-nums text-gold">
                      {formatCurrency(q.recommended)}
                    </p>
                    <p className="mt-0.5 text-[10px] tabular-nums text-zinc-600">
                      {formatCurrency(q.low)}–{formatCurrency(q.high)}
                    </p>
                    <span
                      className={`mt-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${getQuoteStatusClasses(
                        q.status,
                      )}`}
                    >
                      {getQuoteStatusLabel(q.status)}
                    </span>
                  </div>
                </div>

                {(q.sentAt || q.approvedAt || q.estimatedHours > 0 || (photoCounts[q.id] ?? 0) > 0) && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    {q.sentAt && (
                      <span className="badge-purple rounded-full px-2 py-0.5 font-medium">
                        Sent {formatDate(q.sentAt)}
                      </span>
                    )}
                    {q.approvedAt && (
                      <span className="rounded-full border border-brand-purple/30 bg-brand-purple/10 px-2 py-0.5 font-medium text-brand-purple-light">
                        Approved {formatDate(q.approvedAt)}
                      </span>
                    )}
                    {q.estimatedHours > 0 && (
                      <span className="rounded-full border border-[var(--brand-border)] bg-surface px-2 py-0.5 tabular-nums text-zinc-500">
                        {q.estimatedHours.toFixed(1)}h · {formatCurrency(q.revenuePerHour)}/hr
                      </span>
                    )}
                    {(photoCounts[q.id] ?? 0) > 0 && (
                      <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 font-medium text-gold">
                        {photoCounts[q.id]} photo{(photoCounts[q.id] ?? 0) === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                )}

                {readyToBook && (
                  <div className="callout-purple rounded-xl px-3 py-3">
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="label-muted text-brand-purple-light">
                          Ready to book
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                          Client approved this quote. Pick a date and time to add
                          it to your calendar.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={openSchedule}
                        className="btn-secondary shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold active:scale-[0.98] sm:min-w-[9.5rem]"
                      >
                        Book on calendar
                      </button>
                    </div>
                  </div>
                )}

                {q.scheduledDate && (
                  <div className="callout-gold rounded-xl px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="label-muted text-gold">
                        Job booked
                      </p>
                      <span className="badge-success rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide">
                        On calendar
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                      {formatDate(q.scheduledDate)}
                      {q.scheduledTime && ` at ${q.scheduledTime}`}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                      Use Change booking below to update.
                    </p>
                  </div>
                )}

                {q.notes && (
                  <p className="rounded-xl border border-[var(--brand-border)] bg-surface px-3 py-2 text-[11px] leading-relaxed text-zinc-500">
                    {q.notes.length > 160
                      ? `${q.notes.slice(0, 160)}…`
                      : q.notes}
                  </p>
                )}

                <div className="space-y-2.5 border-t border-[var(--brand-border)] pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        Quote status
                      </p>
                      <p className="mt-0.5 text-[10px] text-zinc-600">
                        {getStatusHint(q)}
                      </p>
                    </div>
                    <select
                      value={q.status}
                      onChange={(e) =>
                        updateQuoteStatus(q.id, e.target.value as QuoteStatus)
                      }
                      className="rounded-xl border border-[var(--brand-border)] bg-surface px-3 py-2 text-[11px] font-semibold text-zinc-200 outline-none transition-all duration-200 focus:border-gold/40 focus:ring-1 focus:ring-gold/15"
                    >
                      {QUOTE_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {getQuoteStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Next actions
                    </p>
                    <div
                      className={`grid grid-cols-2 gap-2 ${readyToBook ? "sm:grid-cols-2" : "sm:grid-cols-4"}`}
                    >
                      {readyToBook && (
                        <button
                          type="button"
                          onClick={openSchedule}
                          className={`${primaryAction} btn-secondary col-span-2`}
                        >
                          Book on calendar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEmailDraftTarget({
                            quote: q,
                            invoice: invoices.find((inv) => inv.quoteId === q.id),
                            clientEmail: findClientEmail(clients, q.clientName, q.phone),
                          });
                        }}
                        className={`${primaryAction} btn-primary`}
                      >
                        Email quote
                      </button>
                      {!readyToBook && (
                        <button
                          type="button"
                          onClick={openSchedule}
                          className={`${primaryAction} ${
                            q.scheduledDate
                              ? "btn-primary"
                              : "btn-secondary"
                          }`}
                        >
                          {getScheduleButtonLabel(q)}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPhotoQuoteId((current) =>
                            current === q.id ? null : q.id,
                          )
                        }
                        className={`${primaryAction} btn-primary`}
                      >
                        {(photoCounts[q.id] ?? 0) > 0
                          ? `Photos (${photoCounts[q.id]})`
                          : expandedPhotoQuoteId === q.id
                            ? "Hide photos"
                            : "Add photos"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (q.status === "draft") {
                            setInvoiceConfirmQuote(q);
                            return;
                          }
                          const invoice = buildInvoiceFromQuote(q, invoices);
                          addInvoice(invoice);
                          router.push("/invoices");
                        }}
                        className={`${primaryAction} btn-secondary`}
                      >
                        Create invoice
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingQuote(q)}
                        className={`${secondaryAction} text-zinc-300 hover:bg-zinc-800`}
                      >
                        Edit quote
                      </button>
                      <button
                        type="button"
                        onClick={() => exportQuotePdf(q)}
                        className={`${secondaryAction} text-brand-purple-light hover:bg-brand-purple/10`}
                      >
                        Export PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const linkedInvoice = invoices.find((inv) => inv.quoteId === q.id);
                          if (linkedInvoice) {
                            setDeleteBlockedBanner(
                              `Cannot delete quote: linked invoice ${linkedInvoice.invoiceNumber || linkedInvoice.id} exists.`,
                            );
                            setTimeout(() => setDeleteBlockedBanner(null), 3000);
                            return;
                          }
                          deleteQuote(q.id);
                        }}
                        className={`${secondaryAction} btn-destructive-inline`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

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
              );
            })}
          </div>
        )}
      </section>

      {editSavedBanner && (
        <div className="fixed left-1/2 top-16 z-50 -translate-x-1/2 animate-fade-in rounded-2xl border border-gold/30 bg-surface-raised px-5 py-3 text-xs font-semibold text-gold shadow-lg">
          {editSavedBanner}
        </div>
      )}

      {deleteBlockedBanner && (
        <div className="badge-warning fixed left-1/2 top-28 z-50 -translate-x-1/2 animate-fade-in rounded-2xl px-5 py-3 text-xs font-semibold shadow-lg">
          {deleteBlockedBanner}
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

      {emailDraftTarget && (
        <EmailSendModal
          quote={emailDraftTarget.quote}
          invoice={emailDraftTarget.invoice}
          clientEmail={emailDraftTarget.clientEmail}
          defaultType="quote"
          onClose={() => setEmailDraftTarget(null)}
          portalToBody
          enableEditableCompose
        />
      )}

      {schedulingQuote && (
        <ScheduleJobModal
          quote={schedulingQuote}
          onSchedule={updateQuoteSchedule}
          onClose={() => setSchedulingQuote(null)}
          portalToBody
        />
      )}

      {/* Draft → Invoice confirmation */}
      {invoiceConfirmQuote && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 px-3 pb-24 pt-16 sm:items-center sm:p-4">
          <div className="animate-fade-in-up w-full max-w-sm rounded-2xl border border-[var(--brand-border)] bg-surface-raised p-4 shadow-xl">
            <p className="text-sm font-semibold text-zinc-100">
              Quote still a draft
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Mark as Sent or Approved first for a clearer audit trail. Create invoice anyway?
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setInvoiceConfirmQuote(null)}
                className="flex-1 rounded-xl border border-[var(--brand-border)] bg-surface py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const invoice = buildInvoiceFromQuote(invoiceConfirmQuote, invoices);
                  addInvoice(invoice);
                  setInvoiceConfirmQuote(null);
                  router.push("/invoices");
                }}
                className="flex-1 rounded-xl border border-gold/40 bg-gold/10 py-2.5 text-xs font-bold text-gold transition-colors hover:bg-gold/15"
              >
                Create invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

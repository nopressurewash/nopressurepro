"use client";

import { useMemo, useState } from "react";
import {
  buildInvoiceMailtoHref,
  buildQuoteMailtoHref,
  getInvoiceEmailDraft,
  getQuoteEmailDraft,
} from "../../lib/mailto";
import { exportInvoicePdf } from "../../lib/pdf/exportInvoicePdf";
import { exportQuotePdf } from "../../lib/pdf/exportQuotePdf";
import type { Invoice, Quote } from "../../lib/types";

type SendType = "quote" | "invoice";

interface EmailSendModalProps {
  quote?: Quote;
  invoice?: Invoice;
  clientEmail?: string;
  defaultType: SendType;
  onClose: () => void;
}

export function EmailSendModal({
  quote,
  invoice,
  clientEmail,
  defaultType,
  onClose,
}: EmailSendModalProps) {
  const canSendQuote = Boolean(quote);
  const canSendInvoice = Boolean(invoice);
  const [sendType, setSendType] = useState<SendType>(() => {
    if (defaultType === "invoice" && canSendInvoice) return "invoice";
    return canSendQuote ? "quote" : "invoice";
  });

  const email = clientEmail?.trim() ?? "";
  const clientName = quote?.clientName ?? invoice?.clientName ?? "Client";

  const draft = useMemo(() => {
    if (sendType === "invoice" && invoice) return getInvoiceEmailDraft(invoice);
    if (quote) return getQuoteEmailDraft(quote);
    return { subject: "", body: "" };
  }, [invoice, quote, sendType]);

  async function handleDownloadPdf() {
    if (sendType === "invoice" && invoice) {
      await exportInvoicePdf(invoice);
      return;
    }
    if (quote) {
      await exportQuotePdf(quote);
    }
  }

  function handleOpenEmailApp() {
    if (!email) return;

    if (sendType === "invoice" && invoice) {
      window.location.href = buildInvoiceMailtoHref(invoice, email);
      return;
    }

    if (quote) {
      window.location.href = buildQuoteMailtoHref(quote, email);
    }
  }

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-3 pb-6 pt-[8vh] sm:px-4 sm:pb-10 sm:pt-[10vh]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="animate-fade-in-up flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[var(--brand-border)] bg-surface-raised shadow-2xl sm:max-h-[86vh]">
        <div className="shrink-0 border-b border-[var(--brand-border)] px-5 pb-3.5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Send Email
              </p>
              <p className="mt-1 text-sm font-bold text-zinc-100">
                {clientName}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {email || "No email on file"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-700/60 bg-surface px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-zinc-500 hover:text-zinc-100 active:scale-[0.97]"
            >
              Close
            </button>
          </div>
        </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  Send type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!canSendQuote}
                    onClick={() => setSendType("quote")}
                    className={`rounded-xl border px-3 py-2.5 text-center text-xs font-medium transition-all duration-200 ${
                      sendType === "quote"
                        ? "border-gold/40 bg-gold/10 text-gold"
                        : "border-[var(--brand-border)] bg-surface text-zinc-400 hover:border-zinc-600 active:bg-zinc-800"
                    } ${!canSendQuote ? "cursor-not-allowed opacity-40 hover:border-[var(--brand-border)] hover:bg-surface hover:text-zinc-400" : ""}`}
                  >
                    Quote
                  </button>
                  <button
                    type="button"
                    disabled={!canSendInvoice}
                    onClick={() => setSendType("invoice")}
                    className={`rounded-xl border px-3 py-2.5 text-center text-xs font-medium transition-all duration-200 ${
                      sendType === "invoice"
                        ? "border-brand-purple/40 bg-brand-purple/10 text-brand-purple-light"
                        : "border-[var(--brand-border)] bg-surface text-zinc-400 hover:border-zinc-600 active:bg-zinc-800"
                    } ${!canSendInvoice ? "cursor-not-allowed opacity-40 hover:border-[var(--brand-border)] hover:bg-surface hover:text-zinc-400" : ""}`}
                  >
                    Invoice
                  </button>
                </div>
              </div>

              {!email && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-300">
                  Add a client email in the Clients tab before opening the email app.
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  Subject
                </label>
                <div className="rounded-xl border border-[var(--brand-border)] bg-surface px-3 py-2.5 text-sm text-zinc-200">
                  {draft.subject}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  Message preview
                </label>
                <div className="rounded-xl border border-[var(--brand-border)] bg-surface px-3 py-3 text-sm leading-relaxed text-zinc-300">
                  <pre className="whitespace-pre-wrap font-sans">{draft.body}</pre>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-[var(--brand-border)] px-6 pb-6 pt-5 sm:px-8">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-[var(--brand-border)] bg-surface px-4 py-3 text-sm font-semibold text-zinc-300 transition-all duration-200 hover:bg-zinc-800 active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleDownloadPdf();
                }}
                className="rounded-2xl border border-brand-purple/30 bg-brand-purple/10 px-4 py-3 text-sm font-semibold text-brand-purple-light transition-all duration-200 hover:bg-brand-purple/15 active:scale-[0.98]"
              >
                Download PDF
              </button>
              <button
                type="button"
                onClick={handleOpenEmailApp}
                disabled={!email}
                className="rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm font-bold text-gold transition-all duration-200 hover:bg-gold/15 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Open in Email App
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}

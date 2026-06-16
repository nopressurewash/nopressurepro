"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  buildInvoiceMailtoHref,
  buildQuoteMailtoHref,
  getInvoiceEmailDraft,
  getQuoteEmailDraft,
} from "../../lib/mailto";
import { exportInvoicePdf } from "../../lib/pdf/exportInvoicePdf";
import { exportQuotePdf } from "../../lib/pdf/exportQuotePdf";
import type { Invoice, Quote } from "../../lib/types";

type SendType = "quote" | "invoice" | "email";
type DefaultSendType = "quote" | "invoice";

interface EmailSendModalProps {
  quote?: Quote;
  invoice?: Invoice;
  clientEmail?: string;
  defaultType: DefaultSendType;
  onClose: () => void;
  portalToBody?: boolean;
  enableEditableCompose?: boolean;
}

export function EmailSendModal({
  quote,
  invoice,
  clientEmail,
  defaultType,
  onClose,
  portalToBody = false,
  enableEditableCompose = false,
}: EmailSendModalProps) {
  const [isClient, setIsClient] = useState(false);
  const canSendQuote = Boolean(quote);
  const canSendInvoice = Boolean(invoice);
  const [sendType, setSendType] = useState<SendType>(() => {
    if (defaultType === "invoice" && canSendInvoice) return "invoice";
    return canSendQuote ? "quote" : "invoice";
  });

  const email = clientEmail?.trim() ?? "";
  const clientName = quote?.clientName ?? invoice?.clientName ?? "Client";

  useEffect(() => {
    if (portalToBody) setIsClient(true);
  }, [portalToBody]);

  const draft = useMemo(() => {
    if (sendType === "invoice" && invoice) return getInvoiceEmailDraft(invoice);
    if (quote) return getQuoteEmailDraft(quote);
    return { subject: "", body: "" };
  }, [invoice, quote, sendType]);

  const quoteDraft = useMemo(() => {
    if (!quote) return { subject: "", body: "" };
    return getQuoteEmailDraft(quote);
  }, [quote]);

  const invoiceDraft = useMemo(() => {
    if (!invoice) return { subject: "", body: "" };
    return getInvoiceEmailDraft(invoice);
  }, [invoice]);

  const plainEmailDraft = useMemo(() => {
    return {
      subject: "",
      body: `Hello ${clientName},\n\n`,
    };
  }, [clientName]);

  const [quoteSubject, setQuoteSubject] = useState(quoteDraft.subject);
  const [quoteBody, setQuoteBody] = useState(quoteDraft.body);
  const [invoiceSubject, setInvoiceSubject] = useState(invoiceDraft.subject);
  const [invoiceBody, setInvoiceBody] = useState(invoiceDraft.body);
  const [plainSubject, setPlainSubject] = useState(plainEmailDraft.subject);
  const [plainBody, setPlainBody] = useState(plainEmailDraft.body);

  useEffect(() => {
    setQuoteSubject(quoteDraft.subject);
    setQuoteBody(quoteDraft.body);
  }, [quoteDraft.body, quoteDraft.subject]);

  useEffect(() => {
    setInvoiceSubject(invoiceDraft.subject);
    setInvoiceBody(invoiceDraft.body);
  }, [invoiceDraft.body, invoiceDraft.subject]);

  useEffect(() => {
    setPlainSubject(plainEmailDraft.subject);
    setPlainBody(plainEmailDraft.body);
  }, [plainEmailDraft.body, plainEmailDraft.subject]);

  async function handleDownloadPdf() {
    if (sendType === "email") return;
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

    if (enableEditableCompose) {
      const activeSubject =
        sendType === "invoice"
          ? invoiceSubject
          : sendType === "quote"
            ? quoteSubject
            : plainSubject;
      const activeBody =
        sendType === "invoice"
          ? invoiceBody
          : sendType === "quote"
            ? quoteBody
            : plainBody;
      window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(activeSubject)}&body=${encodeURIComponent(activeBody)}`;
      return;
    }

    if (sendType === "invoice" && invoice) {
      window.location.href = buildInvoiceMailtoHref(invoice, email);
      return;
    }

    if (quote) {
      window.location.href = buildQuoteMailtoHref(quote, email);
    }
  }

  const modalContent = (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex min-h-full items-start justify-center overflow-y-auto bg-black/90 px-4 pb-8 pt-[6vh] sm:items-center sm:px-6 sm:pb-10 sm:pt-[8vh]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="animate-fade-in-up flex max-h-[94vh] w-full max-w-[min(96vw,1200px)] flex-col overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-surface-raised shadow-2xl sm:max-h-[92vh] lg:max-w-[1320px]">
        <div className="flex h-full min-h-[60vh] flex-col">
          <div className="flex-shrink-0 border-b border-[var(--brand-border)] px-6 pb-4 pt-5 sm:px-7">
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
              className="btn-ghost rounded-xl px-3 py-1.5 text-xs font-medium active:scale-[0.97]"
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
                <div
                  className={`grid gap-2 ${enableEditableCompose ? "grid-cols-3" : "grid-cols-2"}`}
                >
                  <button
                    type="button"
                    disabled={!canSendQuote}
                    onClick={() => setSendType("quote")}
                    className={`rounded-xl px-3 py-2.5 text-center text-xs font-medium transition-all duration-200 active:scale-[0.98] ${
                      sendType === "quote"
                        ? "chip-active-primary"
                        : "chip-inactive"
                    } ${!canSendQuote ? "cursor-not-allowed opacity-40 hover:border-[var(--brand-border)] hover:bg-[var(--brand-surface)] hover:text-[var(--text-secondary)]" : ""}`}
                  >
                    Quote
                  </button>
                  <button
                    type="button"
                    disabled={!canSendInvoice}
                    onClick={() => setSendType("invoice")}
                    className={`rounded-xl px-3 py-2.5 text-center text-xs font-medium transition-all duration-200 active:scale-[0.98] ${
                      sendType === "invoice"
                        ? "chip-active-secondary"
                        : "chip-inactive"
                    } ${!canSendInvoice ? "cursor-not-allowed opacity-40 hover:border-[var(--brand-border)] hover:bg-[var(--brand-surface)] hover:text-[var(--text-secondary)]" : ""}`}
                  >
                    Invoice
                  </button>
                  {enableEditableCompose && (
                    <button
                      type="button"
                      onClick={() => setSendType("email")}
                      className={`rounded-xl px-3 py-2.5 text-center text-xs font-medium transition-all duration-200 active:scale-[0.98] ${
                        sendType === "email"
                          ? "chip-active-secondary"
                          : "chip-inactive"
                      }`}
                    >
                      Email
                    </button>
                  )}
                </div>
              </div>

              {!email && (
                <div className="callout-warning rounded-2xl px-4 py-3 text-xs font-medium">
                  Add a client email in the Clients tab before opening the email app.
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  Subject
                </label>
                {enableEditableCompose ? (
                  <input
                    type="text"
                    value={
                      sendType === "invoice"
                        ? invoiceSubject
                        : sendType === "quote"
                          ? quoteSubject
                          : plainSubject
                    }
                    onChange={(event) => {
                      const next = event.target.value;
                      if (sendType === "invoice") setInvoiceSubject(next);
                      else if (sendType === "quote") setQuoteSubject(next);
                      else setPlainSubject(next);
                    }}
                    className="w-full rounded-xl border border-[var(--brand-border)] bg-surface px-3 py-2.5 text-sm text-zinc-100 outline-none transition-all duration-200 focus:border-gold/40 focus:ring-1 focus:ring-gold/15"
                  />
                ) : (
                  <div className="rounded-xl border border-[var(--brand-border)] bg-surface px-3 py-2.5 text-sm text-zinc-200">
                    {draft.subject}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  {enableEditableCompose ? "Message" : "Message preview"}
                </label>
                {enableEditableCompose ? (
                  <textarea
                    value={
                      sendType === "invoice"
                        ? invoiceBody
                        : sendType === "quote"
                          ? quoteBody
                          : plainBody
                    }
                    onChange={(event) => {
                      const next = event.target.value;
                      if (sendType === "invoice") setInvoiceBody(next);
                      else if (sendType === "quote") setQuoteBody(next);
                      else setPlainBody(next);
                    }}
                    rows={10}
                    className="min-h-[220px] w-full rounded-xl border border-[var(--brand-border)] bg-surface px-3 py-3 text-sm leading-relaxed text-zinc-100 outline-none transition-all duration-200 focus:border-gold/40 focus:ring-1 focus:ring-gold/15"
                  />
                ) : (
                  <div className="rounded-xl border border-[var(--brand-border)] bg-surface px-3 py-3 text-sm leading-relaxed text-zinc-300">
                    <pre className="whitespace-pre-wrap font-sans">{draft.body}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-[var(--brand-border)] px-6 pb-6 pt-5 sm:px-8">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost rounded-2xl px-4 py-3 text-sm font-semibold active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleDownloadPdf();
                }}
                disabled={sendType === "email"}
                className="btn-secondary rounded-2xl px-4 py-3 text-sm font-semibold active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Download PDF
              </button>
              <button
                type="button"
                onClick={handleOpenEmailApp}
                disabled={!email}
                className="btn-primary rounded-2xl px-4 py-3 text-sm font-bold active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Open in Email App
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!portalToBody) return modalContent;
  if (!isClient) return null;
  return createPortal(modalContent, document.body);
}
